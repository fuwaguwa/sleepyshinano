interface BooruState {
  currentPage?: number;
  seenIds?: number[];
  maxKnownPage?: number;
}

export interface ShinanoUser {
  userId: string;
  blacklisted?: boolean;
  voteCreatedTimestamp?: number;
  voteExpiredTimestamp?: number;
  booruState?: Map<string, BooruState>;
}
