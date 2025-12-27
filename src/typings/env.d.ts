declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly NODE_ENV: "development" | "production";
      readonly DISCORD_TOKEN: string;
      readonly LOGGING_GUILD_ID: string;
      readonly LOGGING_CHANNEL_ID: string;
      readonly MONGODB_URI: string;
      readonly TOP_GG_TOKEN: string;
      readonly OWNER_IDS: string;
      readonly COOL_PEOPLE_IDS: string;
    }
  }
}