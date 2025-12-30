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
import type { ShinanoUser } from "../typings/schemas/User";
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
 * Randomly produces one post from a booru site
 */

/**
 * Randomly produces one post from a booru site
 * Using Bun's native proxy support - no more curl subprocess! 🎉
 */
export async function queryBooru(site: BooruSite, tags: string): Promise<BooruPost | null> {
  const config = BOORU_CONFIG[site];
  const reqTags = [tags.trim(), ...BOORU_BLACKLIST].join(" ");

  const params = new URLSearchParams({
    page: "dapi",
    s: "post",
    q: "index",
    tags: reqTags,
    limit: config.hasAttributes ? "1" : "100",
    json: "1",
    pid: "0",
  });

  if (config.requiresAuth && config.apiKey && config.userId) {
    params.append("api_key", config.apiKey);
    params.append("user_id", config.userId);
  }

  const url = `${config.apiUrl}?${params.toString()}`;

  const fetchOptions = config.needsProxy ? { proxy: process.env.SOCKS_PROXY } : {};
  const response = await fetch(url, fetchOptions);
  const data = (await response.json()) as BooruResponse;

  // Handle Gelbooru's @attributes wrapper
  if (config.hasAttributes) {
    const gelbooruData = data as GelbooruPostResponse;
    return gelbooruData.post?.[0] ?? null;
  }

  // Handle flat arrays (Rule34, Safebooru)
  if (!data) return null;
  const arrayData = data as Rule34PostResponse | SafebooruPostResponse;
  if (arrayData.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * arrayData.length);
  return arrayData[randomIndex];
}

/**
 * Process booru request from interaction
 */
export async function processBooruRequest({ interaction, tags, site, mode, noTagsOnReply }: BooruSearchOptions) {
  if (!interaction.deferred) await interaction.deferReply();

  const config = BOORU_CONFIG[site];
  const result = await queryBooru(site, tags);

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
    const user = await User.findOne({ userId: interaction.user.id }).lean<ShinanoUser>();
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
      await processBooruRequest({ interaction, tags, site, mode: "followUp", noTagsOnReply: noTagsOnReply ?? false });

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
