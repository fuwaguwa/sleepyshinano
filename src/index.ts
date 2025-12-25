import "./lib/setup";

import { LogLevel, SapphireClient } from "@sapphire/framework";
import { GatewayIntentBits, Options, Partials } from "discord.js";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { connectToDatabase } from "./lib/utils";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const client: SapphireClient = new SapphireClient({
  baseUserDirectory: join(__dirname),
  logger: {
    level: process.env.NODE_ENV === "production" ? LogLevel.Info : LogLevel.Debug,
  },
  shards: "auto",
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  partials: [Partials.Channel],
  loadMessageCommandListeners: true,
  sweepers: {
    ...Options.DefaultSweeperSettings,
    messages: {
      interval: 1200, // 20 minutes
      lifetime: 1800, // 30 minutes
    },
    users: {
      interval: 3600, // 1 hour
      filter: () => user => user.bot && user.id !== client.user?.id,
    },
  },
});

async function main() {
  try {
    await connectToDatabase();
    client.logger.info("Logging in...");
    await client.login(process.env.BOT_TOKEN);
  } catch (error) {
    client.logger.fatal(error);
    await client.destroy();
    process.exit(1);
  }
}

void main();
