import "./core/setup";

import { LogLevel, SapphireClient } from "@sapphire/framework";
import { GatewayIntentBits, Options, Partials } from "discord.js";
import { connectToDatabase } from "./core/database";
import { autoDiscoverPieces } from "./core/virtualPieces";

const client: SapphireClient<true> = new SapphireClient({
  defaultCooldown: {
    limit: 1,
    delay: 4500,
    filteredUsers: process.env.COOL_PEOPLE_IDS.split(","),
  },
  loadDefaultErrorListeners: false,
  baseUserDirectory: null,
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

async function loadVirtualPieces() {
  const baseDir = import.meta.dir;

  await autoDiscoverPieces("commands", "features/*/commands/*.{ts,js}", baseDir);

  await autoDiscoverPieces("listeners", "core/listeners/**/*.{ts,js}", baseDir);
  await autoDiscoverPieces("listeners", "features/*/listeners/**/*.{ts,js}", baseDir);

  await autoDiscoverPieces("preconditions", "core/preconditions/*.{ts,js}", baseDir);
  await autoDiscoverPieces("preconditions", "features/*/preconditions/*.{ts,js}", baseDir);

  await autoDiscoverPieces("interaction-handlers", "features/*/interaction-handlers/**/*.{ts,js}", baseDir);
}
async function main() {
  try {
    await connectToDatabase();
    await loadVirtualPieces();
    client.logger.info("Core(client): Logging in...");
    await client.login(process.env.BOT_TOKEN);
  } catch (error) {
    client.logger.fatal(error);
    await client.destroy();
    process.exit(1);
  }
}

void main();
