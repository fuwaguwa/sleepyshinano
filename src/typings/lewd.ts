import type { ButtonInteraction, ChatInputCommandInteraction, Message } from "discord.js";

export type LewdCategory = "hoyo" | "kemonomimi" | "misc" | "shipgirls" | "undies";

export interface FetchLewdOptions {
  category?: LewdCategory | null;
  isPremium?: boolean;
  format?: "image" | "animated";
  limit?: number;
}

export interface LewdMedia {
  category: LewdCategory;
  premium: boolean;
  link: string;
  format: "image" | "animated";
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
}
