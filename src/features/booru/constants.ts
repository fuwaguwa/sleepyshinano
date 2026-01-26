import type { BooruConfigMap } from "./types/Booru";

export const BOORU_SITES = ["gelbooru", "rule34", "safebooru"] as const;
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
  collectorTimeoutMs: 120000,
  maxFetchRetries: 1, // 3 if something happned with the ISP
  maxSourceUrlLength: 512,
} as const;

export const PAGE_SELECTION = {
  earlyPageProbability: 0.5,
  earlyPageThreshold: 0.4, // Top X% of pages
  pageWeightDecay: 3,
} as const;

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
