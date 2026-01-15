import type { ActionRowBuilder, ButtonBuilder, EmbedBuilder } from "discord.js";
import type { BooruPost, BooruSite } from "./api/booru";

export interface BooruSiteConfig {
  readonly baseUrl: string;
  readonly apiUrl: string;
  readonly apiKey: string | null;
  readonly userId: string | null;
  readonly requiresAuth: boolean;
  readonly hasAttributes: boolean;
  readonly needsProxy: boolean;
}

export type BooruConfigMap = {
  readonly [K in BooruSite]: BooruSiteConfig;
};

export interface MutableBooruState {
  currentPage: number;
  seenIds: number[];
  maxKnownPage: number;
}

export interface BooruPageSelectionResult {
  page: number;
  shouldResetSeenIds: boolean;
}

export interface BooruUserVoteInfo {
  voteCreatedTimestamp: number | undefined;
  voteExpiredTimestamp: number | undefined;
}

export interface QueryBooruResult {
  post: BooruPost | null;
  userVoteInfo: BooruUserVoteInfo | null;
}

export interface BooruReplyContent {
  content?: string;
  embeds?: EmbedBuilder[];
  components: ActionRowBuilder<ButtonBuilder>[];
}
