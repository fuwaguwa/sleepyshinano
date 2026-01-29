import type { ButtonInteraction, ChatInputCommandInteraction, ContainerBuilder, Message } from "discord.js";
import type { Types } from "mongoose";
import type { LewdCategory } from "../../private/types/Lewd";

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

export interface AutolewdDocument {
  _id: Types.ObjectId | string;
  guildId: string;
  channelId: string;
  userId: string;
  category: LewdCategory | "random";
  sentNotVotedWarning: boolean;
}
