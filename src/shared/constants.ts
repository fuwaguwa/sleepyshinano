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
