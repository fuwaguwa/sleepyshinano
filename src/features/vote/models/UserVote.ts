import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";

@modelOptions({
  schemaOptions: {
    collection: "shinano-users-vote",
  },
})
export class User {
  @prop({
    required: true,
    unique: true,
  })
  public userId!: string;

  @prop({
    default: 0,
  })
  public voteCreatedTimestamp!: number;

  @prop({
    default: 0,
  })
  public voteExpiredTimestamp!: number;
}

export const UserVoteModel = getModelForClass(User);
