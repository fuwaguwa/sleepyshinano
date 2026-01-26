declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: string;

      SOCKS_PROXY: string;

      BOT_TOKEN: string;
      MONGODB_URI: string;

      OWNER_IDS: string;
      COOL_PEOPLE_IDS: string;
      LOGGING_GUILD_ID: string;
      LOGGING_CHANNEL_ID: string;

      TOPGG_API_KEY: string;

      GELBOORU_API_KEY: string;
      GELBOORU_USER_ID: string;
      RULE34_API_KEY: string;
      RULE34_USER_ID: string;
      SAUCENAO_API_KEY: string;
    }
  }
}

export {};
