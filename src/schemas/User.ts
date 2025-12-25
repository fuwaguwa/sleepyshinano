import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
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
