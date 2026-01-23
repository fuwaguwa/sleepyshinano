import type {
  ActionRowBuilder,
  ButtonBuilder,
  ChatInputCommandInteraction,
  ContainerBuilder,
  InteractionEditReplyOptions,
  MessagePayload,
  StringSelectMenuBuilder,
} from "discord.js";

export interface ShinanoPaginatorOptions {
  interaction: ChatInputCommandInteraction;
  pages?: ContainerBuilder[];
  extraButtons?: ActionRowBuilder<ButtonBuilder>[];
  payloads?: MessagePayload[] | string[] | InteractionEditReplyOptions[];
  menu?: ActionRowBuilder<StringSelectMenuBuilder>;
  pageCountName?: string;
  interactorOnly: boolean;
  timeout: number;
  startPage?: number;
}
