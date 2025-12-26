import {
  type ChatInputCommandSuccessPayload,
  type Command,
  type ContextMenuCommandSuccessPayload,
  container,
  type MessageCommandSuccessPayload,
} from "@sapphire/framework";
import type {
  ChatInputCommandSubcommandMappingMethod,
  ChatInputSubcommandSuccessPayload,
} from "@sapphire/plugin-subcommands";
import {
  type Guild,
  InteractionContextType,
  type User,
  type VoiceChannel,
} from "discord.js";

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
  let contextInfo: string;

  if ("interaction" in payload) {
    guild = payload.interaction.guild;
    user = payload.interaction.user;
    command = payload.command;

    // Determine context based on interaction.context
    const context = payload.interaction.context;
    if (context === InteractionContextType.Guild && guild) {
      contextInfo = `${guild.name} (${guild.id})`;
    } else if (context === InteractionContextType.BotDM) {
      contextInfo = "Bot DM";
    } else if (context === InteractionContextType.PrivateChannel) {
      contextInfo = "Private Channel (User Install)";
    } else if (guild) {
      contextInfo = `${guild.name} (${guild.id})`;
    } else {
      contextInfo = "DM";
    }
  } else {
    guild = payload.message.guild;
    user = payload.message.author;
    command = payload.command;
    contextInfo = guild ? `${guild.name} (${guild.id})` : "DM";
  }

  const shardId = guild?.shardId ?? 0;
  const subcommandName = subcommand ? ` ${subcommand.name}` : "";

  container.logger.info(
    `[Shard ${shardId}] ${command.name}${subcommandName} | ${user.username} (${user.id}) | ${contextInfo}`
  );
}
