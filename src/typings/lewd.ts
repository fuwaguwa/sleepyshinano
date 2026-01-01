export type LewdCategory = "hoyo" | "kemonomimi" | "misc" | "shipgirls" | "undies";

export interface FetchLewdOptions {
  category?: LewdCategory | null;
  isPremium?: boolean;
  format?: "image" | "animated";
  limit?: number;
}

export interface LewdMedia {
  category: LewdCategory;
  premium: boolean;
  link: string;
  format: "image" | "animated";
}
