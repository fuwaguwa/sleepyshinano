import type { BooruState } from "../api/booru";

export interface ShinanoUser {
  userId: string;
  blacklisted?: boolean;
  voteCreatedTimestamp?: number;
  voteExpiredTimestamp?: number;
  booruState?: Map<string, BooruState>;
}
