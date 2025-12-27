import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export const VOTE_LINK_BUTTON: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder<ButtonBuilder>().setComponents(
  new ButtonBuilder()
    .setStyle(ButtonStyle.Link)
    .setLabel("Vote for Shinano!")
    .setEmoji({ id: "1002849574517477447" })
    .setURL("https://top.gg/bot/1002193298229829682/vote")
);
