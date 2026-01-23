import type { Subcommand } from "@sapphire/plugin-subcommands";
import type { ButtonInteraction, ChatInputCommandInteraction } from "discord.js";

export type ProcessableInteraction =
  | ChatInputCommandInteraction
  | Subcommand.ChatInputCommandInteraction
  | ButtonInteraction;
