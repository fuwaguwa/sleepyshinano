import { container, type SapphireClient } from "@sapphire/framework";
import mongoose from "mongoose";
import { connectToDatabase } from "./database";

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
    client.logger.info(`Core(database): Connecting to database... (Attempt #${connectingAttempt})`);
  });

  mongoose.connection.on("connected", () => {
    connectedToDatabase = true;
    client.logger.info("Core(database): Connected to the database!");
  });

  mongoose.connection.on("disconnected", () => {
    client.logger.error("Core(database): Lost database connection...");

    if (connectedToDatabase) {
      // Was connected before, this is an unexpected disconnect
      client.logger.error("Core(database): Unexpected database disconnect - restarting bot...");
      container.logger.info("Core(database): Restarting...");
      process.exit(1);
    } else {
      // Never connected, try to reconnect
      client.logger.info("Core(database): Attempting to reconnect to the database...");
      void connectToDatabase();
    }
  });

  mongoose.connection.on("reconnected", () => {
    client.logger.info("Core(database): Reconnected to the database!");
  });

  mongoose.connection.on("error", err => {
    client.logger.error("Database error:", err);
  });
}
