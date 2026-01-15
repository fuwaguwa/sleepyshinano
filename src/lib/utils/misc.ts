import { ChannelType } from "discord.js";
import type { ProcessableInteraction } from "../../typings/interaction";
import type { LewdCategory } from "../../typings/lewd";
import { BOORU_QUERY } from "../constants";

/**
 * Pick a random item from an array
 */
export function randomItem<T>(array: readonly T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

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

/**
 * Unix timestamp in seconds
 */
export function getCurrentTimestamp() {
  return Math.floor(Date.now() / 1000);
}

export function getRandomLewdCategory(): LewdCategory {
  return randomItem<LewdCategory>(["hoyo", "kemonomimi", "misc", "shipgirls", "undies"]);
}

export function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm)$/i.test(url);
}

export function isValidSourceUrl(source: string | undefined): source is string {
  return !!source && /^https?:\/\//i.test(source) && source.length <= BOORU_QUERY.maxSourceUrlLength;
}
