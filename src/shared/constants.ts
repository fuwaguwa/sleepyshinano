import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export const MAIN_GUILD_ID = "1020960562710052895";

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

export const LOADING_EMOJI = "<a:lod:1021265223707000923>";

export const SHINANO_CONFIG = {
  nodeEnv: process.env.NODE_ENV as "production" | "development",
  socksProxy: process.env.SOCKS_PROXY!,
  botToken: process.env.BOT_TOKEN!,
  mongoUri: process.env.MONGODB_URI!,
  loggingGuildId: process.env.LOGGING_GUILD_ID!,
  loggingChannelId: process.env.LOGGING_CHANNEL_ID!,
  coolPeopleIds: process.env.COOL_PEOPLE_IDS?.split(",") ?? [],
  ownerIds: process.env.OWNER_IDS?.split(",") ?? [],
  topggApiKey: process.env.TOPGG_API_KEY!,
  gelbooruApiKey: process.env.GELBOORU_API_KEY!,
  gelbooruUserId: process.env.GELBOORU_USER_ID!,
  rule34ApiKey: process.env.RULE34_API_KEY!,
  rule34UserId: process.env.RULE34_USER_ID!,
  saucenaoApiKey: process.env.SAUCENAO_API_KEY!,
} as const;

export const IMMUNE_IDS = [...SHINANO_CONFIG.coolPeopleIds, ...SHINANO_CONFIG.ownerIds];
