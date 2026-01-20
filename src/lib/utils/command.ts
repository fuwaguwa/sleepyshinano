import { ActionRowBuilder, ButtonBuilder, ButtonStyle, type User } from "discord.js";
import { getCurrentTimestamp } from "./misc";

/**
 * Standard command options used across most commands
 */
export const standardCommandOptions = {
  cooldownLimit: 1,
  cooldownDelay: 4500,
  cooldownFilteredUsers: process.env.COOL_PEOPLE_IDS.split(","),
  preconditions: ["NotBlacklisted"],
} as const;

/**
 * Create a standard footer for embeds
 */
export function createFooter(user: User) {
  return {
    text: `Requested by ${user.username}`,
    iconURL: user.displayAvatarURL({ forceStatic: false }),
  };
}

/**
 * Create text footer for components v2
 */
export function createTextFooter(user: User) {
  return `-# Requested by ${user.username} | <t:${getCurrentTimestamp()}:R>`;
}

/**
 * Create an image info action row with link and sauce buttons
 */
export function createImageActionRow(imageUrl: string) {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setStyle(ButtonStyle.Link).setEmoji({ name: "🔗" }).setLabel("Image Link").setURL(imageUrl),
    new ButtonBuilder()
      .setStyle(ButtonStyle.Secondary)
      .setEmoji({ name: "🔍" })
      .setLabel("Get Sauce")
      .setCustomId("getSauce")
  );
}
