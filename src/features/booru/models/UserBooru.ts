import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";

class BooruState {
  @prop({ default: 0 })
  public currentPage?: number;

  @prop({
    type: [Number],
    default: [],
  })
  public seenIds?: number[];

  @prop({ default: 0 })
  public maxKnownPage?: number;
}

@modelOptions({
  schemaOptions: {
    collection: "shinano-users-booru",
  },
})
export class UserBooru {
  @prop({
    required: true,
    unique: true,
  })
  public userId!: string;

  @prop({
    type: BooruState,
    default: () => new Map(),
  })
  public booruState!: Map<string, BooruState>;
}

export const UserBooruModel = getModelForClass(UserBooru);
