import type {
  ButtonInteraction,
  ChatInputCommandInteraction,
  ContainerBuilder,
  EmbedBuilder,
  Message,
} from "discord.js";
import type { BooruPost, BooruSite } from "./API";

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
  voteCreatedTimestamp: number | null;
  voteExpiredTimestamp: number | null;
}

export interface QueryBooruResult {
  post: BooruPost | null;
  userVoteInfo: BooruUserVoteInfo | null;
}

export interface BooruReplyContent {
  content?: string;
  embeds?: EmbedBuilder[];
  components: any[];
  flags?: number;
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
