import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";
import { LEWD_CATEGORIES } from "../constants";
import type { LewdCategory } from "../types/Lewd";

@modelOptions({
  schemaOptions: {
    collection: "autolewds",
  },
})
export class Autolewd {
  @prop({
    required: true,
    unique: true,
  })
  public guildId!: string;

  @prop({
    required: true,
  })
  public channelId!: string;

  @prop({
    required: true,
  })
  public userId!: string;

  @prop({
    required: true,
    enum: ["random", ...LEWD_CATEGORIES],
    type: String,
  })
  public category!: LewdCategory | "random";

  @prop({
    required: true,
    default: false,
  })
  public sentNotVotedWarning!: boolean;
}

export const AutolewdModel = getModelForClass(Autolewd);
