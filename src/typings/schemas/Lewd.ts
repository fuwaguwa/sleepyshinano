export interface LewdImage {
  category: "hoyo" | "kemonomimi" | "misc" | "shipgirls" | "undies";
  premium: boolean;
  format: "image" | "animated";
  link: string;
}
