import { ChannelType } from "discord.js";
import type { ProcessableInteraction } from "../../typings/interaction";

/**
 * Pick a random item from an array
 */
export function randomItem<T>(array: readonly T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Check if a link is a direct image/GIF link
 */
export function isImageAndGif(url: string) {
  return url.match(/^http[^?]*.(jpg|jpeg|png|gif)(\?(.*))?$/gim) != null;
}

export function isGuildInteraction(interaction: ProcessableInteraction) {
  return interaction.guildId != null;
}

export function isUserDM(interaction: ProcessableInteraction) {
  return (
    interaction.channel?.type === ChannelType.DM && interaction.channel.recipient?.id !== interaction.client.user.id
  );
}

export function isGroupDM(interaction: ProcessableInteraction) {
  return interaction.channel?.type === ChannelType.GroupDM;
}

export function isTextChannelNonNSFW(interaction: ProcessableInteraction) {
  return interaction.channel?.type === 0 && !interaction.channel.nsfw;
}
