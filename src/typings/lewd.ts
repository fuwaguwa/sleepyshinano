import type { ButtonInteraction, ChatInputCommandInteraction, ContainerBuilder, Message } from "discord.js";
import type { LEWD_CATEGORIES, LEWD_FORMAT } from "../lib/constants";

export type LewdCategory = (typeof LEWD_CATEGORIES)[number];
export type LewdFormat = (typeof LEWD_FORMAT)[number];

export interface FetchLewdOptions {
  category?: LewdCategory | null;
  isPremium?: boolean;
  format?: LewdFormat;
  limit?: number;
}

export interface LewdResult {
  category: LewdCategory;
  link: string;
  format: LewdFormat;
}

export interface LewdMedia extends LewdResult {
  premium: boolean;
}

export interface AutolewdButtonOptions {
  showEnable: boolean;
  showDisable: boolean;
  disabled?: boolean;
  userId: string;
}

export interface AutolewdHandleButtonOptions {
  buttonInteraction: ButtonInteraction;
  commandInteraction: ChatInputCommandInteraction;
  category: LewdCategory | "random";
  isUpdate: boolean;
}

export interface AutolewdCollectorOptions {
  response: Message;
  interaction: ChatInputCommandInteraction;
  category: LewdCategory | "random";
  isUpdate: boolean;
  showEnable: boolean;
  showDisable: boolean;
  container: ContainerBuilder;
}
