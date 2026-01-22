import type { InteractionDeferReplyOptions, InteractionEditReplyOptions, InteractionReplyOptions } from "discord.js";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MessageFlags,
  SectionBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
} from "discord.js";
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

function createErrorContainer(message: string): ContainerBuilder {
  const errorText = new TextDisplayBuilder().setContent(`❌ ${message}`);
  const errorContainer = new ContainerBuilder().addTextDisplayComponents(errorText).setAccentColor([255, 0, 0]);
  return errorContainer;
}

function createLoadingContainer(steps: { link?: boolean; sauce?: boolean; filter?: boolean }): ContainerBuilder {
  const linkStatus = steps.link ? "✅ Valid Link!" : `${LOADING_EMOJI} Validating Link...`;
  const sauceStatus = steps.sauce ? "✅ Sauce Found!" : `${LOADING_EMOJI} Searching For Sauce...`;
  const filterStatus = steps.filter ? "✅ Link Filtered!" : `${LOADING_EMOJI} Filtering...`;
  const loadingText = new TextDisplayBuilder().setContent(
    `## Processing...\n${linkStatus}\n${sauceStatus}\n${filterStatus}`
  );
  const loadingContainer = new ContainerBuilder().addTextDisplayComponents(loadingText).setAccentColor([0, 255, 0]);
  return loadingContainer;
}

function createNoResultContainer(): ContainerBuilder {
  const noResultText = new TextDisplayBuilder().setContent("❌ No results were found!");
  const thumbnail = new ThumbnailBuilder().setURL(
    "https://cdn.discordapp.com/attachments/977409556638474250/999486337822507058/akairo-azur-lane.gif"
  );
  const section = new SectionBuilder().addTextDisplayComponents(noResultText).setThumbnailAccessory(thumbnail);
  const noResultContainer = new ContainerBuilder().addSectionComponents(section).setAccentColor([255, 0, 0]);
  return noResultContainer;
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

function buildSiteSections(results: LocalSauceResult[], container: ContainerBuilder, thumbnail?: string): void {
  const danbooru = results.find(r => r.site === "Danbooru");
  const yandere = results.find(r => r.site === "Yande.re");
  const konachan = results.find(r => r.site === "Konachan");
  const pixiv = results.find(r => r.site === "Pixiv");
  const sections: SectionBuilder[] = [];
  const fieldSeparator = new SeparatorBuilder();

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
    const danbooruText = new TextDisplayBuilder().setContent(`### Danbooru\n${parts.join("\n") || "N/A"}`);
    const danbooruSection = new SectionBuilder().addTextDisplayComponents(danbooruText);
    if (thumbnail) {
      const postThumbnail = new ThumbnailBuilder().setURL(thumbnail);
      danbooruSection.setThumbnailAccessory(postThumbnail);
    }
    sections.push(danbooruSection);
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
    const pixivText = new TextDisplayBuilder().setContent(`### Pixiv\n${parts.join("\n") || "N/A"}`);
    const pixivSection = new SectionBuilder().addTextDisplayComponents(pixivText);
    if (thumbnail) {
      const postThumbnail = new ThumbnailBuilder().setURL(thumbnail);
      pixivSection.setThumbnailAccessory(postThumbnail);
    }
    sections.push(pixivSection);
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
    const yandereText = new TextDisplayBuilder().setContent(`### Yande.re\n${parts.join("\n") || "N/A"}`);
    const yandereSection = new SectionBuilder().addTextDisplayComponents(yandereText);
    if (thumbnail) {
      const postThumbnail = new ThumbnailBuilder().setURL(thumbnail);
      yandereSection.setThumbnailAccessory(postThumbnail);
    }
    sections.push(yandereSection);
  }

  if (konachan && sections.length < 4) {
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
    const konachanText = new TextDisplayBuilder().setContent(`### Konachan\n${parts.join("\n") || "N/A"}`);
    const konachanSection = new SectionBuilder().addTextDisplayComponents(konachanText);
    if (thumbnail) {
      const postThumbnail = new ThumbnailBuilder().setURL(thumbnail);
      konachanSection.setThumbnailAccessory(postThumbnail);
    }
    sections.push(konachanSection);
  }

  // Add sections and separators to container
  for (let i = 0; i < sections.length; i++) {
    container.addSectionComponents(sections[i]);
    if (i < sections.length - 1) container.addSeparatorComponents(fieldSeparator);
  }
}

function buildResultContainer(results: LocalSauceResult[]): ContainerBuilder {
  const firstResult = results[0];
  const thumbnail = typeof firstResult.thumbnail === "string" ? firstResult.thumbnail : undefined;
  const container = new ContainerBuilder();
  const headerText = new TextDisplayBuilder().setContent("## Sauce...Found?");
  let section: SectionBuilder;

  const indexName = getRawField<string>(firstResult.raw, ["raw", "header", "index_name"]);
  const rawSource = getRawField<string>(firstResult.raw, ["raw", "data", "source"]);

  if (rawSource && indexName?.includes("H-Anime")) {
    const sauceText = new TextDisplayBuilder().setContent(`**Sauce:** ${rawSource}`);
    const timestampText = new TextDisplayBuilder().setContent(
      `**Estimated Timestamp:** ${String(getRawField(firstResult.raw, ["raw", "data", "est_time"]) ?? "N/A")}`
    );
    section = new SectionBuilder().addTextDisplayComponents(headerText, sauceText, timestampText);
    if (thumbnail) {
      const postThumbnail = new ThumbnailBuilder().setURL(thumbnail);
      section.setThumbnailAccessory(postThumbnail);
    }
    container.addSectionComponents(section);
  } else {
    container.addTextDisplayComponents(headerText);
    buildSiteSections(results, container, thumbnail);
  }

  // Footer
  const footerText = new TextDisplayBuilder().setContent("-# Similarity is displayed below.");
  container.addTextDisplayComponents(footerText);
  return container;
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

function buildButtonRow(sortedLinks: SauceSortedLinks): ActionRowBuilder<ButtonBuilder> | null {
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

  return row.components.length > 0 ? row : null;
}

// ============================================================================
// Main Function
// ============================================================================

export async function getSauce({ interaction, link, ephemeral = true }: SauceOptions): Promise<void> {
  // Defer reply if not already done
  if (!interaction.deferred && !interaction.replied) {
    const opts: InteractionDeferReplyOptions = {};
    if (ephemeral) opts.flags = MessageFlags.Ephemeral;
    await interaction.deferReply(opts);
  }

  // UPDATE: Started processing
  await interaction.editReply({
    flags: MessageFlags.IsComponentsV2,
    components: [createLoadingContainer({ link: false, sauce: false, filter: false })],
  });

  // Validate image
  const validation = await validateImageLink(link);
  if (!validation.valid) {
    await interaction.editReply({
      flags: MessageFlags.IsComponentsV2,
      components: [createErrorContainer(validation.error ?? "Unknown error")],
    });
    return;
  }

  // UPDATE: Link validated
  await interaction.editReply({
    flags: MessageFlags.IsComponentsV2,
    components: [createLoadingContainer({ link: true, sauce: false, filter: false })],
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
        flags: MessageFlags.IsComponentsV2,
        components: [createErrorContainer("Failed to query SauceNAO. Try again later.")],
      });
      return;
    }
  }

  // Check for no results
  if (!Array.isArray(rawResults) || rawResults.length === 0) {
    await interaction.editReply({
      flags: MessageFlags.IsComponentsV2,
      components: [createNoResultContainer()],
    });
    return;
  }

  // UPDATE: sauce found
  await interaction.editReply({
    flags: MessageFlags.IsComponentsV2,
    components: [createLoadingContainer({ link: true, sauce: true, filter: false })],
  });

  // Process results
  const results = mapRawResults(rawResults);
  const resultContainer = buildResultContainer(results);
  const sortedLinks = sortLinksBySite(results);
  const buttonRow = buildButtonRow(sortedLinks);

  // UPDATE: Filtering complete
  await interaction.editReply({
    flags: MessageFlags.IsComponentsV2,
    components: [createLoadingContainer({ link: true, sauce: true, filter: true })],
  });

  if (buttonRow) {
    const separator = new SeparatorBuilder();
    resultContainer.addSeparatorComponents(separator);
    resultContainer.addActionRowComponents(buttonRow);
  }
  const replyOptions: InteractionReplyOptions = {
    flags: MessageFlags.IsComponentsV2,
    components: [resultContainer],
  };

  if (interaction.deferred || interaction.replied) {
    await interaction.editReply(replyOptions as InteractionEditReplyOptions);
    return;
  }

  if (ephemeral) replyOptions.flags = [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2];
  await interaction.reply(replyOptions);
}
