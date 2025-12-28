import { $ } from "bun";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  ComponentType,
  EmbedBuilder,
  type InteractionEditReplyOptions,
  type InteractionReplyOptions,
  MessageFlagsBitField,
} from "discord.js";
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

const BOORU_CONFIG = {
  gelbooru: {
    baseUrl: "https://gelbooru.com/index.php",
    apiKey: process.env.GELBOORU_API_KEY!,
    userId: process.env.GELBOORU_USER_ID!,
    requiresAuth: true,
    hasAttributes: true,
    needsProxy: true,
  },
  rule34: {
    baseUrl: "https://api.rule34.xxx/index.php",
    apiKey: process.env.RULE34_API_KEY,
    userId: process.env.RULE34_USER_ID,
    requiresAuth: false,
    hasAttributes: false,
    needsProxy: true,
  },
  safebooru: {
    baseUrl: "https://safebooru.org/index.php",
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
 * NOTE: Using curl subprocess as workaround for Bun's SOCKS5 proxy issues
 * I have no clue how to fix this, this is my workaround for now.
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

  const url = `${config.baseUrl}?${params.toString()}`;

  let data: BooruResponse;

  if (config.needsProxy) {
    // Use curl subprocess for proxied requests
    const result = await $`curl --socks5 127.0.0.1:40000 -s --compressed ${url}`.text();
    data = JSON.parse(result) as BooruResponse;
  } else {
    // Use native fetch for non-proxied requests
    const response = await fetch(url);
    data = (await response.json()) as BooruResponse;
  }

  // Handle Gelbooru's @attributes wrapper
  if (config.hasAttributes) {
    const gelbooruData = data as GelbooruPostResponse;
    return gelbooruData.post?.[0] ?? null;
  }

  // Handle flat arrays (Rule34, Safebooru)
  const arrayData = data as Rule34PostResponse | SafebooruPostResponse;
  if (arrayData.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * arrayData.length);
  return arrayData[randomIndex];
}

/**
 * Process booru request from interaction
 */
export async function processBooruRequest({ interaction, tags, site, mode }: BooruSearchOptions) {
  if (!interaction.deferred) await interaction.deferReply();

  const config = BOORU_CONFIG[site];
  const result = await queryBooru(site, tags);

  // No result
  if (!result) {
    await interaction.editReply({ embeds: [noResultEmbed] });
    return;
  }

  // Setup
  const links = new ActionRowBuilder<ButtonBuilder>().setComponents(
    new ButtonBuilder()
      .setStyle(ButtonStyle.Link)
      .setLabel("Post Link")
      .setEmoji({ name: "🔗" })
      .setURL(config.baseUrl + result.id)
  );

  const loadMore: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder<ButtonBuilder>().setComponents(
    new ButtonBuilder()
      .setStyle(ButtonStyle.Secondary)
      .setLabel("Load More")
      .setEmoji({ name: "🔄" })
      .setCustomId(`loadMore-${interaction.user.id}`)
  );

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

  // Check if in DM channel (but not with bot)
  const isDMChannel =
    (interaction.channel?.type === ChannelType.DM &&
      interaction.channel.recipient?.id !== interaction.client.user.id) ||
    interaction.channel?.type === ChannelType.GroupDM;

  // User vote => unlock "Load More" button with faster cooldown (only if not in DM)
  if (!isDMChannel) {
    const user = await User.findOne({ userId: interaction.user.id }).lean<ShinanoUser>();
    // 43200s = 12h
    const hasVoted =
      process.env.COOL_PEOPLE_IDS!.split(",").includes(interaction.user.id) ||
      (user?.voteTimestamp && Math.floor(Date.now() / 1000) - user.voteTimestamp <= 43200);

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
  } else {
    loadMore.components[0].setLabel("Load more is disabled in DMs!").setDisabled(true);
  }

  // Sending message
  let message = "**Requested Tag(s)**: ";
  message += tags
    .split(" ")
    .map(tag => `\`${tag}\``)
    .join(", ");

  const replyOptions: InteractionReplyOptions | InteractionEditReplyOptions = { components: [links, loadMore] };
  let booruEmbed: EmbedBuilder;
  if (isVideo) {
    replyOptions.content = `${message}\n\n${result.file_url}`;
  } else {
    booruEmbed = new EmbedBuilder()
      .setColor("Random")
      .setImage(result.file_url)
      .setDescription(message)
      .setFooter({
        text: `Requested by ${interaction.user.username}`,
        iconURL: interaction.user.displayAvatarURL({ forceStatic: false }),
      });

    replyOptions.embeds = [booruEmbed];
  }

  const chatMessage = await (mode === "followUp"
    ? interaction.followUp(replyOptions as InteractionReplyOptions)
    : interaction.editReply(replyOptions as InteractionEditReplyOptions));

  // Don't set up collector in DM channels
  if (isDMChannel) return;

  const collector = chatMessage.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 35000, // 35s
  });
  buttonCollector.set(interaction.user.id, collector);

  collector.on("collect", async i => {
    const isUserButton = i.customId.endsWith(i.user.id);

    if (!isUserButton) {
      return i.reply({
        content: "This button does not pertain to you!",
        flags: MessageFlagsBitField.Flags.Ephemeral,
      });
    }

    if (i.customId.includes("loadMore")) {
      if (await buttonCooldownCheck("loadMore", i)) return;

      await i.deferUpdate();

      loadMore.components[0].setDisabled(true);
      await chatMessage.edit({ components: [links, loadMore] });
      await processBooruRequest({ interaction, tags, site, mode: "followUp" });

      buttonCooldownSet("loadMore", i);
      return collector.stop("done");
    }
  });

  collector.on("end", async (collected, reason) => {
    if (reason !== "done") {
      loadMore.components[0].setDisabled(true);
      await chatMessage.edit({ components: [links, loadMore] });
    }
  });
}
