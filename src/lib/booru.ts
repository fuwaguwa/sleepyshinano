import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
  type InteractionEditReplyOptions,
  type InteractionReplyOptions,
  MessageFlagsBitField,
} from "discord.js";
import { fetch } from "netbun";
import User from "../schemas/User";
import type {
  BooruPost,
  BooruResponse,
  BooruSearchOptions,
  BooruSite,
  GelbooruPostResponse,
  Rule34PostResponse,
  SafebooruPostResponse,
} from "../typings/api/booru";
import { buttonCollector, buttonCooldownCheck, buttonCooldownSet } from "./collectors";
import { BOORU_BLACKLIST } from "./constants";
import { getCurrentTimestamp, isGroupDM, isGuildInteraction, isUserDM } from "./utils/misc";

const BOORU_CONFIG = {
  gelbooru: {
    baseUrl: "https://gelbooru.com/index.php?page=post&s=view&id=",
    apiUrl: "https://gelbooru.com/index.php",
    apiKey: process.env.GELBOORU_API_KEY,
    userId: process.env.GELBOORU_USER_ID,
    requiresAuth: true,
    hasAttributes: true,
    needsProxy: true,
  },
  rule34: {
    baseUrl: "https://rule34.xxx/index.php?page=post&s=view&id=",
    apiUrl: "https://api.rule34.xxx/index.php",
    apiKey: process.env.RULE34_API_KEY,
    userId: process.env.RULE34_USER_ID,
    requiresAuth: true,
    hasAttributes: false,
    needsProxy: true,
  },
  safebooru: {
    baseUrl: "https://safebooru.org/index.php?page=post&s=view&id=",
    apiUrl: "https://safebooru.org/index.php",
    apiKey: undefined,
    userId: undefined,
    requiresAuth: false,
    hasAttributes: false,
    needsProxy: false,
  },
} as const;

const noResultEmbed = new EmbedBuilder().setColor("Red").setDescription("❌ | No result found!");

/**
 * Weighting for better and non repeated results
 */
function weightedRandomByScore(posts: BooruPost[]): BooruPost {
  const weights = posts.map(post => {
    const score = post.score ?? 0;
    return Math.max(1, Math.sqrt(Math.max(0, score)));
  });

  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < posts.length; i++) {
    random -= weights[i];
    if (random <= 0) return posts[i];
  }

  return posts[posts.length - 1];
}

/**
 * Fetching posts from booru site
 */
async function fetchBooruPosts(site: BooruSite, tags: string, page: number, useRandom: boolean): Promise<BooruPost[]> {
  const config = BOORU_CONFIG[site];

  const blacklistWithoutSort = BOORU_BLACKLIST.filter(tag => !tag.startsWith("sort:"));
  const sortTag = useRandom ? "sort:random" : "sort:score";
  const reqTags = [tags.trim(), ...blacklistWithoutSort, sortTag].join(" ");

  const params = new URLSearchParams({
    page: "dapi",
    s: "post",
    q: "index",
    tags: reqTags,
    limit: "100",
    json: "1",
    pid: page.toString(),
  });

  if (config.requiresAuth && config.apiKey && config.userId) {
    params.append("api_key", config.apiKey);
    params.append("user_id", config.userId);
  }

  const url = `${config.apiUrl}?${params.toString()}`;
  const fetchOptions = config.needsProxy ? { proxy: process.env.SOCKS_PROXY } : {};
  const response = await fetch(url, fetchOptions);
  const data = (await response.json()) as BooruResponse;

  if (config.hasAttributes) {
    const gelbooruData = data as GelbooruPostResponse;
    return gelbooruData.post ?? [];
  }

  return (data as Rule34PostResponse | SafebooruPostResponse) ?? [];
}

/**
 * Randomly produces one post from a booru site
 */
export async function queryBooru(
  site: BooruSite,
  tags: string,
  userId: string,
  useRandom: boolean = true
): Promise<BooruPost | null> {
  // Random mode
  if (useRandom) {
    const posts = await fetchBooruPosts(site, tags, 0, true);
    if (posts.length === 0) return null;
    return posts[Math.floor(Math.random() * posts.length)];
  }

  // Weighted mode
  const cacheKey = `${site}:${tags.trim()}`;

  let user = await User.findOne({ userId });
  if (!user) user = await User.create({ userId, booruState: new Map() });

  const booruStateMap = user.booruState || new Map();
  const state = booruStateMap.get(cacheKey) || { currentPage: 0, seenIds: [], maxKnownPage: 0 };

  const posts = await fetchBooruPosts(site, tags, state.currentPage, false);

  // If page doesn't exist, reset to page 0
  if (posts.length === 0) {
    state.currentPage = 0;
    state.seenIds = [];
    booruStateMap.set(cacheKey, state);
    await User.updateOne({ userId }, { booruState: booruStateMap });
    return queryBooru(site, tags, userId, useRandom);
  }

  // Update max known page if we've discovered a new one
  if (state.currentPage > state.maxKnownPage) state.maxKnownPage = state.currentPage;

  // Filter unseen posts
  const seenSet = new Set(state.seenIds);
  const unseenPosts = posts.filter(p => !seenSet.has(p.id));

  // Current page exhausted
  if (unseenPosts.length === 0) {
    // Calculate top 35% of known pages (rounded up)
    const topPageLimit = Math.ceil(state.maxKnownPage * 0.35);
    const earlyPagesCount = Math.max(1, topPageLimit + 1); // +1 because page 0 exists

    // 80% chance: Jump back to early pages (top 30%)
    // 20% chance: Move to next page (explore further)
    if (Math.random() < 0.8) {
      // Weighted random selection of early pages
      const earlyPages = Array.from({ length: earlyPagesCount }, (_, i) => i);
      const weights = earlyPages.map(page => Math.exp(-page / 3));
      const totalWeight = weights.reduce((a, b) => a + b, 0);

      let random = Math.random() * totalWeight;
      for (let i = 0; i < earlyPages.length; i++) {
        random -= weights[i];
        if (random <= 0) {
          state.currentPage = i;
          break;
        }
      }
    } else {
      // Continue exploring: go to next page
      state.currentPage++;
    }

    state.seenIds = [];
    booruStateMap.set(cacheKey, state);
    await User.updateOne({ userId }, { booruState: booruStateMap });
    return queryBooru(site, tags, userId, useRandom);
  }

  // Weighted selection
  const selected = weightedRandomByScore(unseenPosts);
  state.seenIds.push(selected.id);

  // Save state
  booruStateMap.set(cacheKey, state);
  await User.updateOne({ userId }, { booruState: booruStateMap });

  return selected;
}

/**
 * Process booru request from interaction
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
  const result = await queryBooru(site, tags, interaction.user.id, useRandom);

  // No result
  if (!result) {
    await interaction.editReply({ embeds: [noResultEmbed] });
    return;
  }

  // Determine if Load More should be shown
  let shouldShowLoadMore = true;

  if (isUserDM(interaction) || isGroupDM(interaction)) {
    // Hide load more in user DMs and group DMs
    shouldShowLoadMore = false;
  } else if (isGuildInteraction(interaction)) {
    // Check if bot is in the guild
    const botIsInGuild = interaction.guild?.members.cache.has(interaction.client.user.id);
    if (!botIsInGuild) {
      shouldShowLoadMore = false;
    }
  }

  // Setup buttons
  const links = new ActionRowBuilder<ButtonBuilder>().setComponents(
    new ButtonBuilder()
      .setStyle(ButtonStyle.Link)
      .setLabel("Post Link")
      .setEmoji({ name: "🔗" })
      .setURL(config.baseUrl + result.id)
  );

  // Only create loadMore button if it should be shown
  const components: ActionRowBuilder<ButtonBuilder>[] = [links];

  if (shouldShowLoadMore) {
    const loadMore = new ActionRowBuilder<ButtonBuilder>().setComponents(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Secondary)
        .setLabel("Load More")
        .setEmoji({ name: "🔄" })
        .setCustomId(`loadMore-${interaction.user.id}`)
    );

    // User vote check (only if showing load more)
    const user = await User.findOne({ userId: interaction.user.id }).lean();
    const currentTime = getCurrentTimestamp();
    let voteValid = false;

    if (user?.voteCreatedTimestamp && user.voteExpiredTimestamp) voteValid = currentTime < user.voteExpiredTimestamp;

    const hasVoted = process.env.COOL_PEOPLE_IDS.split(",").includes(interaction.user.id) || voteValid;

    if (!hasVoted) {
      loadMore.components[0].setLabel("Load More (Lower CD)").setDisabled(true);
      loadMore.addComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setLabel("Vote to use button!")
          .setEmoji({ id: "1002849574517477447" })
          .setURL("https://top.gg/bot/1002193298229829682/vote")
      );
    }

    components.push(loadMore);
  }

  // Validation
  const isValidSourceUrl = result.source && /^https?:\/\//i.test(result.source) && result.source.length <= 512;
  const isVideo = /\.(mp4|webm)$/i.test(result.file_url);

  if (isValidSourceUrl) {
    links.addComponents(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setLabel("Sauce Link")
        .setEmoji({ name: "🔍" })
        .setURL(result.source)
    );
  } else if (!isVideo) {
    links.addComponents(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Secondary)
        .setCustomId(`getSauce`)
        .setLabel("Get Sauce")
        .setEmoji({ name: "🔍" })
    );
  }

  // Sending message
  const message = noTagsOnReply
    ? null
    : `**Requested Tag(s)**: ${tags
        .split(" ")
        .map(tag => `\`${tag}\``)
        .join(", ")}`;

  const replyOptions: InteractionReplyOptions | InteractionEditReplyOptions = { components };

  if (isVideo) {
    replyOptions.content = message ? `${message}\n\n${result.file_url}` : result.file_url;
  } else {
    const booruEmbed = new EmbedBuilder()
      .setColor("Random")
      .setImage(result.file_url)
      .setFooter({
        text: `Requested by ${interaction.user.username}`,
        iconURL: interaction.user.displayAvatarURL({ forceStatic: false }),
      });

    if (message) booruEmbed.setDescription(message);

    replyOptions.embeds = [booruEmbed];
  }

  const chatMessage = await (mode === "followUp"
    ? interaction.followUp(replyOptions as InteractionReplyOptions)
    : interaction.editReply(replyOptions as InteractionEditReplyOptions));

  // Only set up collector if Load More button is shown
  if (!shouldShowLoadMore) return;

  const collector = chatMessage.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 35000,
  });
  buttonCollector.set(interaction.user.id, collector);

  collector.on("collect", async i => {
    if (i.customId.includes("getSauce")) return;
    const isUserButton = i.customId.endsWith(i.user.id);

    if (!isUserButton) {
      return i.reply({
        content: "This button does not belong to you!",
        flags: MessageFlagsBitField.Flags.Ephemeral,
      });
    }

    if (i.customId.includes("loadMore")) {
      if (await buttonCooldownCheck("loadMore", i)) return;

      await i.deferUpdate();

      const loadMore = components[1]; // Get the loadMore component
      loadMore.components[0].setDisabled(true);
      await chatMessage.edit({ components });
      await processBooruRequest({ interaction, tags, site, mode: "followUp", noTagsOnReply: noTagsOnReply, useRandom });

      buttonCooldownSet("loadMore", i);
      return collector.stop("done");
    }
  });

  collector.on("end", async (_, reason) => {
    if (reason !== "done") {
      const loadMore = components[1];
      loadMore.components[0].setDisabled(true);
      await chatMessage.edit({ components });
    }
  });
}
