import type { ProcessableInteraction } from "../types/Interaction";

export function isImageAndGif(url: string) {
  return url.match(/^http[^?]*.(jpg|jpeg|png|gif)(\?(.*))?$/gim) != null;
}

export function isTextChannelNonNSFW(interaction: ProcessableInteraction) {
  return interaction.channel?.type === 0 && !interaction.channel.nsfw;
}
