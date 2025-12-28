import type { Command } from "@sapphire/framework";
import type { Subcommand } from "@sapphire/plugin-subcommands";
import type { ButtonInteraction } from "discord.js";

export interface LocalSauceResult {
  url: string;
  similarity: number | string;
  thumbnail?: string;
  raw: unknown;
  site?: string;
}

export interface SauceOptions {
  interaction: Command.ChatInputCommandInteraction | Subcommand.ChatInputCommandInteraction | ButtonInteraction;
  link: string;
  ephemeral?: boolean;
}

export type SauceSortedLinks = Record<string, string>;
