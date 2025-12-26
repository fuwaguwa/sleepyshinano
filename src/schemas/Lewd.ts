import mongoose, { Schema } from "mongoose";

const LewdSchema = new Schema({
  category: {
    type: String,
    required: true,
    enum: ["hoyo", "kemonomimi", "misc", "shipgirls", "undies"],
    index: true,
  },
  premium: {
    type: Boolean,
    required: true,
    default: false,
    index: true,
  },
  format: {
    type: String,
    required: true,
    enum: ["image", "animated"],
    index: true,
  },
  link: {
    type: String,
    required: true,
    unique: true,
  },
});

// Compound index for efficient queries
LewdSchema.index({ category: 1, format: 1, premium: 1 });

export default mongoose.model("lewd", LewdSchema);
