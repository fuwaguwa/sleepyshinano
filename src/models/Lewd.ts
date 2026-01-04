import { getModelForClass, index, modelOptions, prop } from "@typegoose/typegoose";
import { LEWD_CATEGORIES, LEWD_FORMAT } from "../lib/constants";
import type { LewdCategory } from "../typings/lewd";

@index({ category: 1, format: 1, premium: 1 })
@modelOptions({
  schemaOptions: {
    collection: "lewds",
  },
})
export class Lewd {
  @prop({
    required: true,
    enum: LEWD_CATEGORIES,
    type: String,
    index: true,
  })
  public category!: LewdCategory;

  @prop({
    required: true,
    default: false,
    index: true,
  })
  public premium!: boolean;

  @prop({
    required: true,
    enum: LEWD_FORMAT,
    type: String,
    index: true,
  })
  public format!: string;

  @prop({
    required: true,
    unique: true,
  })
  public link!: string;
}

export const LewdModel = getModelForClass(Lewd);
