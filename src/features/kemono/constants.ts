export const KEMONO_BASE_URL = "https://kemono.cr";
export const KEMONO_API_BASE_URL = `${KEMONO_BASE_URL}/api`;
export const KEMONO_SERVICES = [
  "patreon",
  "fanbox",
  "fantia",
  "gumroad",
  "boosty",
  "afdian",
  "dlsite",
  "subscribestar",
] as const;
export const KEMONO_INTERACTION_TIMEOUT = 5 * 60 * 1000; // 5 minutes
