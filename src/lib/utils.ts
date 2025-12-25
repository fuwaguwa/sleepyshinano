import {
  type ChatInputCommandSuccessPayload,
  type Command,
  type ContextMenuCommandSuccessPayload,
  container,
  type MessageCommandSuccessPayload,
  type SapphireClient,
} from "@sapphire/framework";
import type {
  ChatInputCommandSubcommandMappingMethod,
  ChatInputSubcommandSuccessPayload,
} from "@sapphire/plugin-subcommands";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type ChatInputCommandInteraction,
  type Guild,
  type Interaction,
  type User,
  type VoiceChannel,
} from "discord.js";
import mongoose from "mongoose";
import { buttonCollector, paginationCollector } from "./collectors";

// ==================== Command Helpers ====================

/**
 * Standard command options used across most commands
 */
export const standardCommandOptions = {
  cooldownLimit: 1,
  cooldownDelay: 4500,
  cooldownFilteredUsers: process.env.OWNER_IDS?.split(",") || [],
  preconditions: ["NotBlacklisted"],
} as const;

/**
 * Create a standard footer for embeds
 */
export function createFooter(user: User) {
  return {
    text: `Requested by ${user.username}`,
    iconURL: user.displayAvatarURL({ forceStatic: false }),
  };
}

/**
 * Create an image info action row with link and sauce buttons
 */
export function createImageActionRow(imageUrl: string) {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setStyle(ButtonStyle.Link)
      .setEmoji({ name: "🔗" })
      .setLabel("Image Link")
      .setURL(imageUrl),
    new ButtonBuilder()
      .setStyle(ButtonStyle.Secondary)
      .setEmoji({ name: "🔍" })
      .setLabel("Get Sauce")
      .setCustomId("SAUCE")
  );
}

/**
 * Fetch JSON from an API with error handling
 */
export async function fetchJson<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }
  return (await response.json()) as Promise<T>;
}

/**
 * Pick a random item from an array
 */
export function randomItem<T>(array: readonly T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// ==================== Database & Logging ====================

/**
 * Connect to MongoDB database
 */
export async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    container.logger.info("Connected to MongoDB");
  } catch (error) {
    container.logger.error("Failed to connect to MongoDB:", error);
    throw error;
  }
}

/**
 * Update server count on bot's listings and logging server
 */
export async function updateServerCount() {
  // Only run in prod
  if (process.env.NODE_ENV !== "production") {
    container.logger.debug("Skipping server count update (not in production)");
    return;
  }

  // Only defined in production environment
  const loggingGuildId = process.env.LOGGING_GUILD_ID;
  const loggingChannelId = process.env.LOGGING_CHANNEL_ID;

  const serverCount = container.client.guilds.cache.size;

  try {
    // Update logging server
    if (loggingGuildId && loggingChannelId) {
      const guild = await container.client.guilds.fetch(loggingGuildId);
      const channel = (await guild.channels.fetch(
        loggingChannelId
      )) as VoiceChannel;
      await channel.setName(`Server Count: ${serverCount}`);
    }

    // Update Top.gg
    if (process.env.TOPGG_API_KEY) {
      const botId = container.client.user?.id;
      await fetch(`https://top.gg/api/bots/${botId}/stats`, {
        method: "POST",
        headers: {
          Authorization: process.env.TOPGG_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ server_count: serverCount }),
      });
    }
  } catch (error) {
    container.logger.error("Failed to update server count:", error);
  }
}

/**
 * Restarting bot, pm2 should autorestart
 */
export function restartBot() {
  container.logger.debug("Restarting bot...");
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
    client.logger.info(
      `Connecting to database... (Attempt #${connectingAttempt})`
    );
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
 * Log successful command execution
 */
export function logSuccessfulCommand(
  payload:
    | ContextMenuCommandSuccessPayload
    | ChatInputCommandSuccessPayload
    | MessageCommandSuccessPayload
    | ChatInputSubcommandSuccessPayload,
  subcommand?: ChatInputCommandSubcommandMappingMethod
): void {
  let guild: Guild | null;
  let user: User;
  let command: Command;

  if ("interaction" in payload) {
    guild = payload.interaction.guild;
    user = payload.interaction.user;
    command = payload.command;
  } else {
    guild = payload.message.guild;
    user = payload.message.author;
    command = payload.command;
  }

  const shardId = guild?.shardId ?? 0;
  const guildInfo = guild ? `${guild.name} (${guild.id})` : "DM";
  const subcommandName = subcommand ? ` ${subcommand.name}` : "";

  container.logger.debug(
    `[Shard ${shardId}] ${command.name}${subcommandName} | ${user.username} (${user.id}) | ${guildInfo}`
  );
}

/**
 * Refresh/clean up user collectors when they run a new command
 */
export function collectorsRefresh(
  interaction: ChatInputCommandInteraction | Interaction
) {
  // Stop and remove existing button collectors for this user
  if (buttonCollector.has(interaction.user.id)) {
    const collector = buttonCollector.get(interaction.user.id);
    if (collector && !collector.ended) collector.stop();
    buttonCollector.delete(interaction.user.id);
  }

  // Stop and remove existing pagination collectors for this user
  if (paginationCollector.has(interaction.user.id)) {
    const collector = paginationCollector.get(interaction.user.id);
    if (collector && !collector.ended) collector.stop();
    paginationCollector.delete(interaction.user.id);
  }
}
