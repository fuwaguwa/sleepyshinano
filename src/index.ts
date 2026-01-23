import "./core/setup";

import { LogLevel, SapphireClient } from "@sapphire/framework";
import { GatewayIntentBits, Options, Partials } from "discord.js";
import { connectToDatabase } from "./core/database";

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
  const glob = new Bun.Glob("./**/_load.{ts,js}");
  for await (const file of glob.scan({ cwd: import.meta.dir })) {
    await import(`./${file}`);
  }
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
