import { ApplicationCommandRegistries, RegisterBehavior } from "@sapphire/framework";
import { config } from "dotenv";
import { join } from "path";
import "@sapphire/plugin-logger/register";
import "@sapphire/plugin-subcommands/register";

const env = process.env.NODE_ENV || "development";
config({ path: join(process.cwd(), `.env.${env}`) });

// Set default behavior for slash commands
ApplicationCommandRegistries.setDefaultBehaviorWhenNotIdentical(RegisterBehavior.BulkOverwrite);
