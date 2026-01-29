import type { LEWD_CATEGORIES, LEWD_FORMAT } from "../constants";

export type LewdCategory = (typeof LEWD_CATEGORIES)[number];
export type LewdFormat = (typeof LEWD_FORMAT)[number];

export interface FetchLewdOptions {
  category?: LewdCategory | null;
  isPremium?: boolean;
  format?: LewdFormat;
  limit?: number;
}

export interface LewdResult {
  category: LewdCategory;
  link: string;
  format: LewdFormat;
}

export interface LewdMedia extends LewdResult {
  premium: boolean;
}
