import type { Types } from "mongoose";
import type { LewdCategory } from "../lewd";

export interface AutolewdDocument {
  _id: Types.ObjectId | string;
  guildId: string;
  channelId: string;
  userId: string;
  category: LewdCategory | "random";
  sentNotVotedWarning: boolean;
}
