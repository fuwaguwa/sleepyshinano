import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";

@modelOptions({
  schemaOptions: {
    collection: "shinano-users",
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
  public blacklisted!: boolean;
}

export const UserModel = getModelForClass(User);
