import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import type { BooruConfigMap } from "../typings/booru";

export const TOPGG_BASE_URL = "https://top.gg/bot/1002193298229829682";
export const TOPGG_VOTE_URL = `${TOPGG_BASE_URL}/vote`;
export const TOPGG_EMOJI_ID = "1002849574517477447";

export const VOTE_LINK_BUTTON = new ActionRowBuilder<ButtonBuilder>().setComponents(
  new ButtonBuilder()
    .setStyle(ButtonStyle.Link)
    .setLabel("Vote for Shinano!")
    .setEmoji({ id: "1002849574517477447" })
    .setURL(TOPGG_VOTE_URL)
);

export const SAUCE_EMOJIS = {
  Pixiv: "<:pixiv:1003211984747118642>",
  Twitter: "<:twitter:1003211986697453680>",
  Danbooru: "<:danbooru:1003212182156230686>",
  Gelbooru: "<:gelbooru:1003211988916252682>",
  "Yande.re": "🔪",
  Konachan: "⭐",
  Fantia: "<:fantia:1003211990673670194>",
  AniDB: "<:anidb:1003211992410107924>",
};

export const LOADING_EMOJI = "<a:lod:1021265223707000923>";

export const BOORU_BLACKLIST = [
  "-guro",
  "-furry",
  "-scat",
  "-amputee",
  "-vomit",
  "-insect",
  "-bestiality",
  "-ryona",
  "-death",
  "-vore",
  "-torture",
  "-pokephilia",
  "-animal_genitalia",
  "-anthro",
  "-loli",
  "-shota",
  "-ai-generated",
  "-ai-assisted",
  "-ai_assisted",
  "-ai_generated",
  "-futanari",
];

export const MAIN_GUILD_ID = "1020960562710052895";

export const CAT_API_URL = "https://api.thecatapi.com/v1/images/search";
export const CATGIRL_API_URL = "https://nekos.best/api/v2/neko";
export const DOG_API_URL = "https://dog.ceo/api/breeds/image/random";
export const FOX_API_URL = "https://randomfox.ca/floof/";
export const FOXGIRL_API_URL = "https://nekos.best/api/v2/kitsune";
export const HUSBANDO_API_URL = "https://nekos.best/api/v2/husbando";
export const WAIFU_API_URL = "https://nekos.best/api/v2/waifu";

export const LEWD_CATEGORIES = ["hoyo", "kemonomimi", "misc", "shipgirls", "undies"] as const;
export const LEWD_FORMAT = ["image", "animated"] as const;

export const BOORU_CONFIG: BooruConfigMap = {
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
    apiKey: null,
    userId: null,
    requiresAuth: false,
    hasAttributes: false,
    needsProxy: false,
  },
} as const;

export const BOORU_QUERY = {
  limit: 100,
  collectorTimeoutMs: 35000,
  maxFetchRetries: 3,
  maxSourceUrlLength: 512,
} as const;

export const PAGE_SELECTION = {
  earlyPageProbability: 0.8,
  earlyPageThreshold: 0.35,
  pageWeightDecay: 3,
} as const;
