declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: string;
      OWNER_IDS: string;

      SOCKS_PROXY: string;

      BOT_TOKEN: string;
      LOGGING_GUILD_ID: string;
      LOGGING_CHANNEL_ID: string;
      COOL_PEOPLE_IDS: string;

      MONGODB_URI: string;
      TAILSCALE_AUTH_KEY: string;
      SERVER_HOST: string;
      SERVER_USER: string;

      TOPGG_API_KEY: string;

      GELBOORU_API_KEY: string;
      GELBOORU_USER_ID: string;
      RULE34_API_KEY: string;
      RULE34_USER_ID: string;
    }
  }
}

export {};
