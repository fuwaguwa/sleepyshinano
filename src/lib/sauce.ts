import type { InteractionDeferReplyOptions, InteractionReplyOptions } from "discord.js";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlagsBitField } from "discord.js";
import sagiri from "sagiri";
import type { LocalSauceResult, SauceOptions, SauceSortedLinks } from "../typings/sauce";
import { LOADING_EMOJI, SAUCE_EMOJIS } from "./constants";
import { isImageAndGif } from "./utils/misc";

// ============================================================================
// Type Guards & Utilities
// ============================================================================

// Check for plain object
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Safely get nested field from raw result
function getRawField<T = unknown>(raw: unknown, path: string[]): T | undefined {
  let current: unknown = raw;

  for (const key of path) {
    if (!isRecord(current) || !(key in current)) return undefined;
    current = current[key];
  }

  return current as T | undefined;
}

// Stringification
function stringifyValue(value: unknown): string | undefined {
  if (value == null) return undefined;

  if (typeof value === "string") return value.length > 0 ? value : undefined;

  if (typeof value === "number") return String(value);

  // If array: join with comma + space
  if (Array.isArray(value)) {
    if (value.length === 0) return undefined;
    return value.map(item => String(item)).join(", ");
  }

  // Convert Object to JSON if not empty
  if (isRecord(value)) return Object.keys(value).length > 0 ? JSON.stringify(value) : undefined;

  return undefined;
}

// ============================================================================
// Embed Builders
// ============================================================================

function createErrorEmbed(message: string): EmbedBuilder {
  return new EmbedBuilder().setColor("Red").setDescription(`❌ | ${message}`);
}

function createLoadingEmbed(steps: { link?: boolean; sauce?: boolean; filter?: boolean }): EmbedBuilder {
  const linkStatus = steps.link ? "✅ | Valid Link!" : `${LOADING_EMOJI} | Validating Link...`;
  const sauceStatus = steps.sauce ? "✅ | Sauce Found!" : `${LOADING_EMOJI} | Searching For Sauce...`;
  const filterStatus = steps.filter ? "✅ | Link Filtered!" : `${LOADING_EMOJI} | Filtering...`;

  return new EmbedBuilder()
    .setTitle("Processing...")
    .setColor("Green")
    .setDescription(`${linkStatus}\n${sauceStatus}\n${filterStatus}`);
}

function createNoResultEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setColor("Red")
    .setDescription("❌ | No results were found!")
    .setImage("https://cdn.discordapp.com/attachments/977409556638474250/999486337822507058/akairo-azur-lane.gif");
}

// ============================================================================
// Validation
// ============================================================================

async function validateImageLink(link: string): Promise<{ valid: boolean; error?: string }> {
  if (!isImageAndGif(link)) return { valid: false, error: "Must be an image/gif!" };

  let response: Response;
  try {
    response = await fetch(link, { method: "HEAD" });
  } catch {
    try {
      response = await fetch(link);
    } catch {
      return { valid: false, error: "Invalid image/gif link/file." };
    }
  }

  if (!response.ok) return { valid: false, error: "Invalid image/gif link/file." };

  const contentLength = response.headers.get("content-length");
  if (contentLength) {
    const fileSizeMB = Number.parseInt(contentLength, 10) / 1_000_000;
    if (fileSizeMB > 20) return { valid: false, error: "File size must not be over 20MB!" };
  }

  return { valid: true };
}

// ============================================================================
// Result Processing
// ============================================================================

function mapRawResults(rawResults: unknown[]): LocalSauceResult[] {
  return rawResults
    .slice(0, 10)
    .map(result => ({
      url: String(getRawField(result, ["url"]) ?? getRawField(result, ["raw", "data", "source"]) ?? ""),
      similarity:
        getRawField<number | string>(result, ["similarity"]) ??
        getRawField<number | string>(result, ["raw", "header", "similarity"]) ??
        "0",
      thumbnail: getRawField<string>(result, ["thumbnail"]),
      raw: result,
      site: getRawField<string>(result, ["site"]),
    }))
    .filter(result => result.url);
}

function extractArtistInfo(raw: unknown, paths: string[][]): string | undefined {
  for (const path of paths) {
    const value = getRawField<string>(raw, path);
    if (value) return stringifyValue(value);
  }
  return undefined;
}

function buildSiteFields(results: LocalSauceResult[], resultEmbed: EmbedBuilder): void {
  const danbooru = results.find(r => r.site === "Danbooru");
  const yandere = results.find(r => r.site === "Yande.re");
  const konachan = results.find(r => r.site === "Konachan");
  const pixiv = results.find(r => r.site === "Pixiv");

  let fieldsAdded = 0;

  if (danbooru) {
    const info = getRawField<Record<string, unknown>>(danbooru.raw, ["raw", "data"]) ?? {};
    const parts: string[] = [];

    const creator = extractArtistInfo(danbooru.raw, [
      ["raw", "data", "creator"],
      ["raw", "data", "author"],
      ["authorName"],
      ["author"],
    ]);
    if (creator) parts.push(`**Artist**: ${creator}`);

    const material = stringifyValue(info.material ?? info.source);
    if (material) parts.push(`**Material**: ${material}`);

    const characters = stringifyValue(info.characters);
    if (characters) parts.push(`**Characters**: ${characters}`);

    resultEmbed.addFields({
      name: "Danbooru:",
      value: parts.join("\n") || "N/A",
      inline: true,
    });
    fieldsAdded++;
  }

  if (pixiv) {
    const info = getRawField<Record<string, unknown>>(pixiv.raw, ["raw", "data"]) ?? {};
    const parts: string[] = [];

    const title = stringifyValue(info.title);
    if (title) parts.push(`**Title**: ${title}`);

    const artist = extractArtistInfo(pixiv.raw, [
      ["raw", "data", "member_name"],
      ["authorName"],
      ["raw", "data", "author"],
      ["author"],
    ]);
    if (artist) parts.push(`**Artist**: ${artist}`);

    const artistId = extractArtistInfo(pixiv.raw, [["raw", "data", "member_id"], ["authorId"], ["authorUrl"]]);
    if (artistId) parts.push(`**Artist ID**: ${artistId}`);

    resultEmbed.addFields({
      name: "Pixiv:",
      value: parts.join("\n") || "N/A",
      inline: fieldsAdded % 2 === 0,
    });
    fieldsAdded++;
  }

  if (yandere) {
    const info = getRawField<Record<string, unknown>>(yandere.raw, ["raw", "data"]) ?? {};
    const parts: string[] = [];

    const creator = extractArtistInfo(yandere.raw, [
      ["raw", "data", "creator"],
      ["raw", "data", "author"],
      ["authorName"],
    ]);
    if (creator) parts.push(`**Artist**: ${creator}`);

    const material = stringifyValue(info.material ?? info.source);
    if (material) parts.push(`**Material**: ${material}`);

    const characters = stringifyValue(info.characters);
    if (characters) parts.push(`**Characters**: ${characters}`);

    resultEmbed.addFields({
      name: "Yande.re:",
      value: parts.join("\n") || "N/A",
    });
    fieldsAdded++;
  }

  if (konachan && fieldsAdded < 4) {
    const info = getRawField<Record<string, unknown>>(konachan.raw, ["raw", "data"]) ?? {};
    const parts: string[] = [];

    const creator = extractArtistInfo(konachan.raw, [
      ["raw", "data", "creator"],
      ["raw", "data", "author"],
      ["authorName"],
    ]);
    if (creator) parts.push(`**Artist**: ${creator}`);

    const material = stringifyValue(info.material ?? info.source);
    if (material) parts.push(`**Material**: ${material}`);

    const characters = stringifyValue(info.characters);
    if (characters) parts.push(`**Characters**: ${characters}`);

    resultEmbed.addFields({
      name: "Konachan:",
      value: parts.join("\n") || "N/A",
      inline: fieldsAdded % 2 === 1,
    });
  }
}

function buildResultEmbed(results: LocalSauceResult[]): EmbedBuilder {
  const firstResult = results[0];
  const thumbnail = typeof firstResult.thumbnail === "string" ? firstResult.thumbnail : null;

  const embed = new EmbedBuilder()
    .setColor("#2b2d31")
    .setTitle("Sauce...Found?")
    .setThumbnail(thumbnail)
    .setFooter({ text: "Similarity is displayed below." });

  const indexName = getRawField<string>(firstResult.raw, ["raw", "header", "index_name"]);
  const rawSource = getRawField<string>(firstResult.raw, ["raw", "data", "source"]);

  if (rawSource && indexName?.includes("H-Anime")) {
    embed.addFields([
      { name: "Sauce:", value: rawSource },
      {
        name: "Estimated Timestamp:",
        value: String(getRawField(firstResult.raw, ["raw", "data", "est_time"]) ?? "N/A"),
      },
    ]);
  } else {
    buildSiteFields(results, embed);
  }

  return embed;
}

function sortLinksBySite(results: LocalSauceResult[]): SauceSortedLinks {
  const sorted: SauceSortedLinks = {};
  const linkData = results.slice(0, 5).map(r => `${r.url}|${r.similarity}%`);

  const sitePatterns: Array<[string, string]> = [
    ["pixiv.net", "Pixiv"],
    ["danbooru.donmai.us", "Danbooru"],
    ["gelbooru.com", "Gelbooru"],
    ["konachan.com", "Konachan"],
    ["yande.re", "Yande.re"],
    ["fantia.jp", "Fantia"],
    ["anidb.net", "AniDB"],
  ];

  for (const link of linkData) {
    for (const [pattern, siteName] of sitePatterns) {
      if (link.includes(pattern) && !sorted[siteName]) {
        sorted[siteName] = link;
        break;
      }
    }
  }

  return sorted;
}

function buildButtonRow(sortedLinks: SauceSortedLinks): ActionRowBuilder<ButtonBuilder> {
  const row = new ActionRowBuilder<ButtonBuilder>();

  for (const [siteName, linkData] of Object.entries(sortedLinks)) {
    const [url, similarity] = linkData.split("|");
    const emoji = SAUCE_EMOJIS[siteName as keyof typeof SAUCE_EMOJIS];

    const button = new ButtonBuilder()
      .setLabel(`${siteName} (${similarity})`)
      .setStyle(ButtonStyle.Link)
      .setURL(url)
      .setEmoji(emoji);

    row.addComponents(button);
  }

  return row;
}

// ============================================================================
// Main Function
// ============================================================================

export async function getSauce({ interaction, link, ephemeral = true }: SauceOptions): Promise<void> {
  // Defer reply if not already done
  if (!interaction.deferred && !interaction.replied) {
    const opts: InteractionDeferReplyOptions = {};
    if (ephemeral) opts.flags = MessageFlagsBitField.Flags.Ephemeral;
    await interaction.deferReply(opts);
  }

  // UPDATE: Started processing
  await interaction.editReply({
    embeds: [createLoadingEmbed({ link: false, sauce: false, filter: false })],
  });

  // Validate image
  const validation = await validateImageLink(link);
  if (!validation.valid) {
    await interaction.editReply({
      embeds: [createErrorEmbed(validation.error ?? "Unknown error")],
    });
    return;
  }

  // UPDATE: Link validated
  await interaction.editReply({
    embeds: [createLoadingEmbed({ link: true, sauce: false, filter: false })],
  });

  const sauceClient = sagiri(process.env.SAUCENAO_API_KEY!);
  let rawResults: unknown;

  try {
    rawResults = await sauceClient(link);
  } catch {
    // Retry once
    try {
      rawResults = await sauceClient(link);
    } catch {
      await interaction.editReply({
        embeds: [createErrorEmbed("Failed to query SauceNAO. Try again later.")],
      });
      return;
    }
  }

  // Check for no results
  if (!Array.isArray(rawResults) || rawResults.length === 0) {
    await interaction.editReply({ embeds: [createNoResultEmbed()] });
    return;
  }

  // UPDATE: sauce found
  await interaction.editReply({
    embeds: [createLoadingEmbed({ link: true, sauce: true, filter: false })],
  });

  // Process results
  const results = mapRawResults(rawResults);
  const resultEmbed = buildResultEmbed(results);
  const sortedLinks = sortLinksBySite(results);
  const buttonRow = buildButtonRow(sortedLinks);

  // UPDATE: Filtering complete
  await interaction.editReply({
    embeds: [createLoadingEmbed({ link: true, sauce: true, filter: true })],
  });

  // Final reply
  if (interaction.deferred || interaction.replied) {
    await interaction.editReply({
      embeds: [resultEmbed],
      components: [buttonRow],
    });
    return;
  }

  const replyOptions: InteractionReplyOptions = {
    embeds: [resultEmbed],
    components: [buttonRow],
  };

  if (ephemeral) replyOptions.flags = MessageFlagsBitField.Flags.Ephemeral;

  await interaction.reply(replyOptions);
}
