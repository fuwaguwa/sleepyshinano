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
  voteCreatedTimestamp: {
    type: Number,
    default: 0,
  },
  voteExpiredTimestamp: {
    type: Number,
    default: 0,
  },
  booruState: {
    type: Map,
    of: {
      currentPage: { type: Number, default: 0 },
      seenIds: { type: [Number], default: [] },
      maxKnownPage: { type: Number, default: 0 },
    },
    default: new Map(),
  },
});

export default mongoose.model("user", userSchema);
