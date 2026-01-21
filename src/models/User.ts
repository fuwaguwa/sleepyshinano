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
    collection: "users",
  },
})
export class User {
  @prop({
    required: true,
    unique: true,
  })
  public userId!: string;

  @prop({
    default: false,
  })
  public blacklisted?: boolean;

  @prop({
    default: 0,
  })
  public voteCreatedTimestamp?: number;

  @prop({
    default: 0,
  })
  public voteExpiredTimestamp?: number;

  @prop({
    type: BooruState,
    default: () => new Map(),
  })
  public booruState?: Map<string, BooruState>;
}

export const UserModel = getModelForClass(User);
