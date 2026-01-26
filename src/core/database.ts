import { container } from "@sapphire/framework";
import mongoose from "mongoose";
import { SHINANO_CONFIG } from "../shared/constants";

export async function connectToDatabase() {
  try {
    await mongoose.connect(SHINANO_CONFIG.mongoUri);
    container.logger.info("Core: Connected to MongoDB");
  } catch (error) {
    container.logger.error("Core: Failed to connect to MongoDB:", error);
    throw error;
  }
}
