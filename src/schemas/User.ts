import mongoose, { Schema } from "mongoose";
import type { ShinanoUser } from "../typings/schemas/User";

const userSchema = new Schema<ShinanoUser>({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  blacklisted: {
    type: Boolean,
    default: false,
  },
  lastVoteTimestamp: {
    type: Number,
    default: 0,
  },
});

export default mongoose.model("user", userSchema);
