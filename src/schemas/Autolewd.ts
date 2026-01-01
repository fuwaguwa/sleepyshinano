import mongoose, { Schema } from "mongoose";

const autoLewdSchema = new Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  guildId: {
    type: String,
    required: true,
    unique: true,
  },
  channelId: {
    type: String,
    required: true,
    unique: true,
  },
  category: {
    type: String,
    required: true,
  },
  sentNotVotedWarning: {
    type: Boolean,
    required: true,
    default: false,
  },
});

export default mongoose.model("autolewd", autoLewdSchema);
