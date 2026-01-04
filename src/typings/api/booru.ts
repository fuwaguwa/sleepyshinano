import type { ProcessableInteraction } from "../interaction";

export type GelbooruRating = "general" | "sensitive" | "questionable" | "explicit";

export type GelbooruPostStatus = "active" | "deleted";

export type GelbooruBooleanString = "true" | "false";

export interface GelbooruPost {
  id: number;
  created_at: string;
  score: number;
  width: number;
  height: number;
  md5: string;
  directory: string;
  image: string;
  rating: GelbooruRating;
  source: string;
  change: number;
  owner: string;
  creator_id: number;
  parent_id: number;
  sample: 0 | 1;
  preview_height: number;
  preview_width: number;
  tags: string;
  title: string;
  has_notes: GelbooruBooleanString;
  has_comments: GelbooruBooleanString;
  file_url: string;
  preview_url: string;
  sample_url: string;
  sample_height: number;
  sample_width: number;
  status: GelbooruPostStatus;
  post_locked: 0 | 1;
  has_children: GelbooruBooleanString;
}

export interface GelbooruPostResponseAttributes {
  limit: number;
  offset: number;
  count: number;
}

export interface GelbooruPostResponse {
  "@attributes": GelbooruPostResponseAttributes;
  post: GelbooruPost[];
}

export type Rule34Rating = "explicit" | "questionable" | "safe" | "general" | "sensitive";

export type Rule34PostStatus = "active" | "deleted";

export interface Rule34Post {
  preview_url: string;
  sample_url: string;
  file_url: string;
  directory: number;
  hash: string;
  width: number;
  height: number;
  id: number;
  image: string;
  change: number;
  owner: string;
  parent_id: number;
  rating: Rule34Rating;
  sample: boolean;
  sample_height: number;
  sample_width: number;
  score: number;
  tags: string;
  source: string;
  status: Rule34PostStatus;
  has_notes: boolean;
  comment_count: number;
}

export type Rule34PostResponse = Rule34Post[];

export type SafebooruRating = "general" | "safe" | "sensitive" | "questionable" | "explicit";

export type SafebooruPostStatus = "active" | "deleted";

export interface SafebooruPost {
  preview_url: string;
  sample_url: string;
  file_url: string;
  directory: number;
  hash: string;
  width: number;
  height: number;
  id: number;
  image: string;
  change: number;
  owner: string;
  parent_id: number;
  rating: SafebooruRating;
  sample: boolean;
  sample_height: number;
  sample_width: number;
  score: number | null;
  tags: string;
  source: string;
  status: SafebooruPostStatus;
  has_notes: boolean;
  comment_count: number;
}

export type SafebooruPostResponse = SafebooruPost[];

export type BooruSite = "gelbooru" | "rule34" | "safebooru";
export type BooruPost = GelbooruPost | Rule34Post | SafebooruPost;
export type BooruResponse = GelbooruPostResponse | Rule34PostResponse | SafebooruPostResponse;

export interface Rule34TagResponse {
  label: string;
  value: string;
  type: string;
}

export interface GelbooruTagResponse {
  tag: Array<{ name: string; count: number }>;
}

export interface BooruSearchOptions {
  interaction: ProcessableInteraction;
  tags: string;
  site: BooruSite;
  mode?: "followUp";
  noTagsOnReply?: boolean;
  useRandom?: boolean;
}

export interface BooruState {
  currentPage: number;
  seenIds: number[];
  maxKnownPage: number;
}
