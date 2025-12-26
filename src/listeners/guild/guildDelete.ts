import { type Events, Listener } from "@sapphire/framework";
import type { Guild } from "discord.js";
import { updateServerCount } from "../../lib/utils/logging";

export class GuildDeleteListener extends Listener<typeof Events.GuildDelete> {
  public override async run(guild: Guild) {
    this.container.logger.info(
      `[${guild.shard.id}] Removed from Guild: ${guild.name} (${guild.id})`
    );

    await updateServerCount();
  }
}
