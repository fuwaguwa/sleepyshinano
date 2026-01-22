import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  ContainerBuilder,
  MediaGalleryBuilder,
  MessageFlags,
  SeparatorBuilder,
  TextDisplayBuilder,
} from "discord.js";
import { fetch } from "netbun";
import { UserModel } from "../models/User";
import type { BooruPost, BooruSearchOptions, BooruSite, GelbooruPostResponse } from "../typings/api/booru";
import type {
  BooruPageSelectionResult,
  BooruReplyContent,
  BooruUserVoteInfo,
  MutableBooruState,
  QueryBooruResult,
} from "../typings/booru";
import { buttonCollector, buttonCooldownCheck, buttonCooldownSet } from "./collectors";
import {
  BOORU_BLACKLIST,
  BOORU_CONFIG,
  BOORU_QUERY,
  PAGE_SELECTION,
  TOPGG_EMOJI_ID,
  TOPGG_VOTE_URL,
} from "./constants";
import {
  cleanBooruTags,
  getCurrentTimestamp,
  isGroupDM,
  isGuildInteraction,
  isUserDM,
  isValidSourceUrl,
  isVideoUrl,
  randomItem,
} from "./utils/misc";

const COOL_PEOPLE_SET = new Set(process.env.COOL_PEOPLE_IDS.split(","));

const voteCache = new Map<string, { hasVoted: boolean; expiresAt: number }>();
const VOTE_CACHE_TTL_MS = 60;

function isGelbooruResponse(data: unknown): data is GelbooruPostResponse {
  if (typeof data !== "object" || data === null) return false;
  if (!("@attributes" in data)) return false;
  return typeof data["@attributes"] === "object" && data["@attributes"] !== null;
}

function parseApiResponse(data: unknown, hasAttributes: boolean): BooruPost[] {
  if (hasAttributes) {
    if (isGelbooruResponse(data)) return data.post ?? [];
    return [];
  }
  if (Array.isArray(data)) return data;
  return [];
}

function extractUserVoteInfo(user: {
  voteCreatedTimestamp?: number;
  voteExpiredTimestamp?: number;
}): BooruUserVoteInfo {
  return {
    voteCreatedTimestamp: user.voteCreatedTimestamp,
    voteExpiredTimestamp: user.voteExpiredTimestamp,
  };
}

function shouldShowLoadMoreButton(interaction: BooruSearchOptions["interaction"]): boolean {
  if (isUserDM(interaction) || isGroupDM(interaction)) return false;
  if (isGuildInteraction(interaction)) return interaction.guild?.members.cache.has(interaction.client.user.id) ?? false;
  return true;
}

function checkVoteStatusFromInfo(voteInfo: BooruUserVoteInfo | null, userId: string): boolean {
  if (COOL_PEOPLE_SET.has(userId)) return true;
  if (!voteInfo?.voteCreatedTimestamp || !voteInfo.voteExpiredTimestamp) return false;
  return getCurrentTimestamp() < voteInfo.voteExpiredTimestamp;
}

async function checkUserVoteStatus(userId: string, cachedVoteInfo: BooruUserVoteInfo | null): Promise<boolean> {
  if (COOL_PEOPLE_SET.has(userId)) return true;

  if (cachedVoteInfo) return checkVoteStatusFromInfo(cachedVoteInfo, userId);

  // Not really a memory problem for a bot this size
  const cached = voteCache.get(userId);
  if (cached && Date.now() < cached.expiresAt) return cached.hasVoted;

  const user = await UserModel.findOne({ userId }).lean();
  const voteInfo: BooruUserVoteInfo = user
    ? { voteCreatedTimestamp: user.voteCreatedTimestamp, voteExpiredTimestamp: user.voteExpiredTimestamp }
    : { voteCreatedTimestamp: undefined, voteExpiredTimestamp: undefined };

  const hasVoted = checkVoteStatusFromInfo(voteInfo, userId);
  voteCache.set(userId, { hasVoted, expiresAt: Date.now() + VOTE_CACHE_TTL_MS });

  return hasVoted;
}

export function createLinkButtons(postUrl: string, sourceUrl: string | undefined, isVideo: boolean) {
  const links = new ActionRowBuilder<ButtonBuilder>().setComponents(
    new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel("Post Link").setEmoji({ name: "🔗" }).setURL(postUrl)
  );

  if (isValidSourceUrl(sourceUrl)) {
    links.addComponents(
      new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel("Sauce Link").setEmoji({ name: "🔍" }).setURL(sourceUrl)
    );
  } else if (!isVideo) {
    links.addComponents(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Secondary)
        .setCustomId("getSauce-eph")
        .setLabel("Get Sauce")
        .setEmoji({ name: "🔍" })
    );
  }

  return links;
}

function createLoadMoreButton(userId: string, hasVoted: boolean) {
  const loadMore = new ActionRowBuilder<ButtonBuilder>().setComponents(
    new ButtonBuilder()
      .setStyle(ButtonStyle.Secondary)
      .setLabel(hasVoted ? "Load More" : "Load More (Lower CD)")
      .setEmoji({ name: "🔄" })
      .setCustomId(`loadMore-${userId}`)
      .setDisabled(!hasVoted)
  );

  if (!hasVoted) {
    loadMore.addComponents(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setLabel("Vote to use button!")
        .setEmoji({ id: TOPGG_EMOJI_ID })
        .setURL(TOPGG_VOTE_URL)
    );
  }

  return loadMore;
}

function buildReplyContent(
  result: BooruPost,
  tags: string,
  noTagsOnReply: boolean,
  components: ActionRowBuilder<ButtonBuilder>[],
  username: string,
  sentAt?: number
): BooruReplyContent {
  const tagMessage = noTagsOnReply
    ? null
    : `**Requested Tag(s)**: ${tags
        .split(" ")
        .map(tag => `\`${tag}\``)
        .join(", ")}`;

  const gallery = new MediaGalleryBuilder().addItems([{ media: { url: result.file_url } }]);
  const description = tagMessage ? new TextDisplayBuilder().setContent(tagMessage) : null;
  const footer = new TextDisplayBuilder().setContent(
    `-# Requested by @${username} | <t:${sentAt ?? getCurrentTimestamp()}:R>`
  );
  const separator = new SeparatorBuilder();
  const container = new ContainerBuilder()
    .addTextDisplayComponents(...[description].filter((c): c is TextDisplayBuilder => !!c))
    .addMediaGalleryComponents(gallery)
    .addTextDisplayComponents(footer)
    .addSeparatorComponents(separator)
    .addActionRowComponents(components);

  return {
    flags: MessageFlags.IsComponentsV2,
    components: [container],
  };
}

/**
 * Randomly selects a post where higher-scoring posts are more likely to be chosen,
 * using the square root of each post’s score as its weight.
 */
function selectWeightedRandomPost(posts: BooruPost[]): BooruPost {
  const weights = posts.map(post => Math.max(1, Math.sqrt(Math.max(0, post.score ?? 0))));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < posts.length; i++) {
    random -= weights[i];
    if (random <= 0) return posts[i];
  }

  return posts[posts.length - 1];
}

/**
 * Selects the next page to load, favoring early pages with weighted randomness
 * or simply advancing to the next page
 */
function selectNextPage(state: MutableBooruState): BooruPageSelectionResult {
  const topPageLimit = Math.ceil(state.maxKnownPage * PAGE_SELECTION.earlyPageThreshold);
  const earlyPagesCount = Math.max(1, topPageLimit + 1);

  if (Math.random() < PAGE_SELECTION.earlyPageProbability) {
    const weights = Array.from({ length: earlyPagesCount }, (_, i) => Math.exp(-i / PAGE_SELECTION.pageWeightDecay));
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < earlyPagesCount; i++) {
      random -= weights[i];
      if (random <= 0) return { page: i, shouldResetSeenIds: true };
    }
    return { page: 0, shouldResetSeenIds: true };
  }

  return { page: state.currentPage + 1, shouldResetSeenIds: true };
}

/**
 * Fetches posts
 */
export async function fetchBooruPosts(
  site: BooruSite,
  tags: string,
  page: number,
  useRandom: boolean
): Promise<BooruPost[]> {
  const config = BOORU_CONFIG[site];
  const sortTag = useRandom ? "sort:random" : "sort:score";
  const reqTags = [tags, ...BOORU_BLACKLIST, sortTag].join(" ");

  const params = new URLSearchParams({
    page: "dapi",
    s: "post",
    q: "index",
    tags: reqTags,
    limit: BOORU_QUERY.limit.toString(),
    json: "1",
    pid: page.toString(),
  });

  if (config.requiresAuth && config.apiKey && config.userId) {
    params.append("api_key", config.apiKey);
    params.append("user_id", config.userId);
  }

  const url = `${config.apiUrl}?${params.toString()}`;
  const fetchOptions = config.needsProxy ? { proxy: process.env.SOCKS_PROXY } : {};

  for (let attempt = 0; attempt < BOORU_QUERY.maxFetchRetries; attempt++) {
    try {
      const response = await fetch(url, fetchOptions);
      if (!response.ok) continue;

      // GelbooruPostResponse | Rule34Post[] | SafebooruPost[]
      const data: unknown = await response.json();
      return parseApiResponse(data, config.hasAttributes);
    } catch {
      if (attempt === BOORU_QUERY.maxFetchRetries - 1) return [];
    }
  }

  return [];
}

/**
 * Update user booru state
 */
export async function queryBooru(
  site: BooruSite,
  tags: string,
  userId: string,
  useRandom = true
): Promise<QueryBooruResult> {
  const filteredTags = cleanBooruTags(tags);
  const keyTags = filteredTags
    .split(" ")
    .filter(tag => !tag.startsWith("-"))
    .sort()
    .join(" ");

  if (useRandom) {
    const posts = await fetchBooruPosts(site, filteredTags, 0, true);
    if (posts.length === 0) return { post: null, userVoteInfo: null };
    return { post: randomItem(posts), userVoteInfo: null };
  }

  const cacheKey = `${site}:${keyTags}`;
  let user = await UserModel.findOne({ userId });
  if (!user) user = await UserModel.create({ userId, booruState: new Map() });
  const booruStateMap = user.booruState ?? new Map<string, MutableBooruState>();

  const existingState = booruStateMap.get(cacheKey);
  let state: MutableBooruState = {
    currentPage: existingState?.currentPage ?? 0,
    seenIds: existingState?.seenIds ?? [],
    maxKnownPage: existingState?.maxKnownPage ?? 0,
  };

  for (let iteration = 0; iteration < BOORU_QUERY.maxFetchRetries; iteration++) {
    const posts = await fetchBooruPosts(site, filteredTags, state.currentPage, false);

    if (posts.length === 0) {
      state = { currentPage: 0, seenIds: [], maxKnownPage: 0 };
      continue;
    }

    if (state.currentPage > state.maxKnownPage) state.maxKnownPage = state.currentPage;

    const seenSet = new Set(state.seenIds);
    const unseenPosts = posts.filter(p => !seenSet.has(p.id));

    if (unseenPosts.length === 0) {
      const selection = selectNextPage(state);
      state.currentPage = selection.page;
      if (selection.shouldResetSeenIds) state.seenIds = [];
      continue;
    }

    const selected = selectWeightedRandomPost(unseenPosts);
    state.seenIds.push(selected.id);

    booruStateMap.set(cacheKey, state);
    user.booruState = booruStateMap;
    await user.save();

    return { post: selected, userVoteInfo: extractUserVoteInfo(user) };
  }

  booruStateMap.set(cacheKey, state);
  user.booruState = booruStateMap;
  await user.save();

  return { post: null, userVoteInfo: extractUserVoteInfo(user) };
}

/**
 * Processes booru request and handles interaction reply + load more
 */
export async function processBooruRequest({
  interaction,
  tags,
  site,
  mode,
  noTagsOnReply = false,
  useRandom,
}: BooruSearchOptions) {
  if (!interaction.deferred) await interaction.deferReply();

  const config = BOORU_CONFIG[site];
  const showLoadMore = shouldShowLoadMoreButton(interaction);

  const { post: result, userVoteInfo } = await queryBooru(site, tags, interaction.user.id, useRandom);

  if (!result) {
    const errorMessage = new TextDisplayBuilder().setContent("❌ No result found!");
    const errorContainer = new ContainerBuilder().addTextDisplayComponents(errorMessage).setAccentColor([255, 0, 0]);
    await interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: [errorContainer] });
    return;
  }

  const postUrl = config.baseUrl + result.id;
  const isVideo = isVideoUrl(result.file_url);

  const links = createLinkButtons(postUrl, result.source, isVideo);
  const components: ActionRowBuilder<ButtonBuilder>[] = [links];

  let loadMore: ActionRowBuilder<ButtonBuilder> | null = null;
  if (showLoadMore) {
    const hasVoted = await checkUserVoteStatus(interaction.user.id, userVoteInfo);
    loadMore = createLoadMoreButton(interaction.user.id, hasVoted);
    components.push(loadMore);
  }

  // Cache the timestamp for footer
  const sentAt = getCurrentTimestamp();
  const replyContent = buildReplyContent(result, tags, noTagsOnReply, components, interaction.user.username, sentAt);

  const chatMessage =
    mode === "followUp" ? await interaction.followUp(replyContent) : await interaction.editReply(replyContent);

  if (!showLoadMore) return;

  const collector = chatMessage.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: BOORU_QUERY.collectorTimeoutMs,
  });

  buttonCollector.set(interaction.user.id, collector);

  collector.on("collect", async i => {
    if (!i.customId.includes("loadMore")) return;

    const isUserButton = i.customId.endsWith(i.user.id);
    if (!isUserButton) {
      return i.reply({
        content: "This button does not belong to you!",
        flags: MessageFlags.Ephemeral,
      });
    }

    if (await buttonCooldownCheck("loadMore", i)) return;

    await i.deferUpdate();

    if (loadMore) {
      loadMore.components[0].setDisabled(true);
      const disabledReplyContent = buildReplyContent(
        result,
        tags,
        noTagsOnReply,
        components,
        interaction.user.username,
        sentAt
      );
      await chatMessage.edit(disabledReplyContent);
    }

    await processBooruRequest({ interaction, tags, site, mode: "followUp", noTagsOnReply, useRandom });
    buttonCooldownSet("loadMore", i);
    return collector.stop("done");
  });

  collector.on("end", async (_, reason) => {
    if (reason !== "done" && loadMore) {
      loadMore.components[0].setDisabled(true);

      // Rebuild the container with the disabled button and re-edit the message
      const disabledReplyContent = buildReplyContent(
        result,
        tags,
        noTagsOnReply,
        components,
        interaction.user.username,
        sentAt
      );
      await chatMessage.edit(disabledReplyContent);
    }
  });
}
