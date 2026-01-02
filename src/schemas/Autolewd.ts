import mongoose, { Schema } from "mongoose";

const autoLewdSchema = new Schema({
  guildId: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: String,
    required: true,
  },
  channelId: {
    type: String,
    required: true,
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
