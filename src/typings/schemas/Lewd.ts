export interface LewdMedia {
  category: "hoyo" | "kemonomimi" | "misc" | "shipgirls" | "undies";
  premium: boolean;
  format: "image" | "animated";
  link: string;
}

export interface FetchLewdOptions {
  category?: "hoyo" | "kemonomimi" | "misc" | "shipgirls" | "undies";
  isPremium?: boolean;
  format?: "image" | "animated";
  limit?: number;
}
