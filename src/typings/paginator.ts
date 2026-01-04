import type {
  ActionRowBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  InteractionEditReplyOptions,
  MessagePayload,
  StringSelectMenuBuilder,
} from "discord.js";

export interface ShinanoPaginatorOptions {
  interaction: ChatInputCommandInteraction;
  pages?: EmbedBuilder[];
  payloads?: MessagePayload[] | string[] | InteractionEditReplyOptions[];
  menu?: ActionRowBuilder<StringSelectMenuBuilder>;
  interactorOnly: boolean;
  timeout: number;
  startPage?: number;
}
