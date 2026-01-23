import type { ProcessableInteraction } from "./Interaction";

export interface LocalSauceResult {
  url: string;
  similarity: number | string;
  thumbnail?: string;
  raw: unknown;
  site?: string;
}

export interface SauceOptions {
  interaction: ProcessableInteraction;
  link: string;
  ephemeral?: boolean;
}

export type SauceSortedLinks = Record<string, string>;
