import { ApplicationCommandRegistries, RegisterBehavior } from "@sapphire/framework";
import "@sapphire/plugin-logger/register";
import "@sapphire/plugin-subcommands/register";
import { config } from "dotenv";

config({ path: `.env.${process.env.NODE_ENV}` });

// Set default behavior for slash commands
ApplicationCommandRegistries.setDefaultBehaviorWhenNotIdentical(RegisterBehavior.BulkOverwrite);
