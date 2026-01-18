import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";
import { BOORU_SITES } from "../lib/constants";
import type { BooruSite } from "../typings/api/booru";

@modelOptions({
  schemaOptions: {
    collection: "autoboorus",
  },
})
export class Autobooru {
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
    enum: BOORU_SITES,
    type: String,
  })
  public site!: BooruSite;

  @prop({
    required: true,
  })
  public tags!: string;

  @prop({
    required: true,
    default: false,
  })
  public isRandom!: boolean;

  @prop({
    required: true,
    default: false,
  })
  public sentNotVotedWarning!: boolean;
}

export const AutobooruModel = getModelForClass(Autobooru);
