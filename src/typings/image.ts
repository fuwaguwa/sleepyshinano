import type { ChatInputCommandInteraction } from "discord.js";

export interface ImageSendOptions {
  interaction: ChatInputCommandInteraction;
  image?: Buffer;
  link?: string;
}

export interface ImageQuoteOptions {
  text: string;
  username: string;
  avatarUrl: string;
}
