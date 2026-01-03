import { container, type SapphireClient } from "@sapphire/framework";
import mongoose from "mongoose";
import { LewdModel } from "../../models/Lewd";
import type { FetchLewdOptions, LewdResult } from ".././../typings/lewd";

/**
 * Connect to MongoDB database
 */
export async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    container.logger.info("Connected to MongoDB");
  } catch (error) {
    container.logger.error("Failed to connect to MongoDB:", error);
    throw error;
  }
}

/**
 * Restarting bot, pm2 should autorestart
 */
export function restartBot() {
  container.logger.info("Restarting bot...");
  process.exit(1);
}

/**
 * Start error catching and database event handlers
 */
export function startCatchers(client: SapphireClient) {
  let connectingAttempt = 0;
  let connectedToDatabase = false;

  // Process error handlers
  process.on("unhandledRejection", (err: any) => {
    client.logger.error("Unhandled Promise Rejection:", err);
  });

  process.on("uncaughtException", err => {
    client.logger.fatal("Uncaught Exception:", err);
    process.exit(1);
  });

  process.on("uncaughtExceptionMonitor", err => {
    client.logger.error("Uncaught Exception (Monitor):", err);
  });

  // Database event handlers
  mongoose.connection.on("connecting", () => {
    connectingAttempt++;
    client.logger.info(`Connecting to database... (Attempt #${connectingAttempt})`);
  });

  mongoose.connection.on("connected", () => {
    connectedToDatabase = true;
    client.logger.info("Connected to the database!");
  });

  mongoose.connection.on("disconnected", () => {
    client.logger.error("Lost database connection...");

    if (connectedToDatabase) {
      // Was connected before, this is an unexpected disconnect
      client.logger.error("Unexpected database disconnect - restarting bot...");
      restartBot();
    } else {
      // Never connected, try to reconnect
      client.logger.info("Attempting to reconnect to the database...");
      void connectToDatabase();
    }
  });

  mongoose.connection.on("reconnected", () => {
    client.logger.info("Reconnected to the database!");
  });

  mongoose.connection.on("error", err => {
    client.logger.error("Database error:", err);
  });
}

/**
 * Fetch random lewd media from database
 */
export async function fetchRandomLewd({ category, isPremium, format, limit = 1 }: FetchLewdOptions = {}) {
  return LewdModel.aggregate<LewdResult>([
    {
      $match: {
        ...(category && { category }),
        ...(isPremium && { premium: true }),
        ...(format && { format }),
      },
    },
    { $sample: { size: limit } },
    {
      $project: {
        category: 1,
        link: 1,
        format: 1,
        _id: 0,
      },
    },
  ]);
}
