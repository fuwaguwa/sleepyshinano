import { ChannelType } from "discord.js";
import type { ProcessableInteraction } from "../../sauce/types/Interaction";
import { BOORU_QUERY } from "../constants";

export function cleanBooruTags(tags: string): string {
  return tags
    .trim()
    .split(" ")
    .filter(tag => !tag.startsWith("sort:"))
    .join(" ");
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

export function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm)$/i.test(url);
}

export function isValidSourceUrl(source: string | undefined): source is string {
  return !!source && /^https?:\/\/[^\s]+$/i.test(source) && source.length <= BOORU_QUERY.maxSourceUrlLength;
}
