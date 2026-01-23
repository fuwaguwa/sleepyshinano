interface BooruState {
  currentPage?: number;
  seenIds?: number[];
  maxKnownPage?: number;
}

export interface ShinanoUserBooru {
  userId: string;
  booruState: Map<string, BooruState>;
}
