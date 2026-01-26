import type { ButtonInteraction, ChatInputCommandInteraction, ContainerBuilder, Message } from "discord.js";
import type { Types } from "mongoose";
import type { BooruSite } from "../../booru/types/API";

export interface AutobooruDocument {
  _id: Types.ObjectId | string;
  guildId: string;
  channelId: string;
  userId: string;
  site: BooruSite;
  tags: string;
  isRandom: boolean;
  sentNotVotedWarning: boolean;
}

export interface AutobooruButtonOptions {
  showEnable: boolean;
  showDisable: boolean;
  disabled?: boolean;
  userId: string;
}

export interface AutobooruCollectorOptions {
  response: Message;
  interaction: ChatInputCommandInteraction;
  site: BooruSite;
  tags: string;
  isRandom: boolean;
  isUpdate: boolean;
  showEnable: boolean;
  showDisable: boolean;
  container: ContainerBuilder;
}

export interface AutobooruHandleButtonsOptions {
  buttonInteraction: ButtonInteraction;
  commandInteraction: ChatInputCommandInteraction;
  site: BooruSite;
  tags: string;
  isRandom: boolean;
  isUpdate: boolean;
}
