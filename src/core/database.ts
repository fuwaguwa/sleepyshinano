import { container } from "@sapphire/framework";
import mongoose from "mongoose";

export async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    container.logger.info("Core: Connected to MongoDB");
  } catch (error) {
    container.logger.error("Core: Failed to connect to MongoDB:", error);
    throw error;
  }
}
