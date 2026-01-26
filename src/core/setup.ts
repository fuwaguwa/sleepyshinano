import { ApplicationCommandRegistries, RegisterBehavior } from "@sapphire/framework";
import "@sapphire/plugin-logger/register";
import "@sapphire/plugin-subcommands/register";
import { config } from "dotenv";

// NODE_ENV must be either production or development
config({ path: `.env.${process.env.NODE_ENV}` });

// Validate required environment variables
const requiredEnvVars = [
  "SOCKS_PROXY",
  "BOT_TOKEN",
  "LOGGING_GUILD_ID",
  "LOGGING_CHANNEL_ID",
  "MONGODB_URI",
  "TOPGG_API_KEY",
  "GELBOORU_API_KEY",
  "GELBOORU_USER_ID",
  "RULE34_API_KEY",
  "RULE34_USER_ID",
  "SAUCENAO_API_KEY",
] as const;

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(",")}`);
  process.exit(1);
}

// Set default behavior for slash commands
ApplicationCommandRegistries.setDefaultBehaviorWhenNotIdentical(RegisterBehavior.BulkOverwrite);
