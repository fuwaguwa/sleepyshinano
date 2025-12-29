import type { Command } from "@sapphire/framework";
import type { Subcommand } from "@sapphire/plugin-subcommands";
import type { ButtonInteraction } from "discord.js";

export type ProcessableInteraction =
  | Command.ChatInputCommandInteraction
  | Subcommand.ChatInputCommandInteraction
  | ButtonInteraction;
