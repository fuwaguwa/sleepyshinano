import type { Types } from "mongoose";

export interface AutobooruDocument {
  _id: Types.ObjectId | string;
  guildId: string;
  channelId: string;
  userId: string;
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
