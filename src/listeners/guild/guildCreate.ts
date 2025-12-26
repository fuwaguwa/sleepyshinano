import { type Events, Listener } from "@sapphire/framework";
import { AuditLogEvent, type Guild } from "discord.js";
import { updateServerCount } from "../../lib/utils/logging";

export class GuildCreateListener extends Listener<typeof Events.GuildCreate> {
  public override async run(guild: Guild) {
    try {
      const auditLog = await guild.fetchAuditLogs({
        type: AuditLogEvent.BotAdd,
        limit: 1,
      });

      const entry = auditLog.entries.first();
      const adder = entry?.executor;

      if (adder) {
        this.container.logger.info(
          `[${guild.shard.id}] New Guild: ${guild.name} (${guild.id}) - Added by: ${adder.username} (${adder.id})`
        );
      } else {
        this.container.logger.info(
          `[${guild.shard.id}] New Guild: ${guild.name} (${guild.id})`
        );
      }

      await updateServerCount();
    } catch (error) {
      this.container.logger.error("Error in guildCreate listener:", error);
    }
  }
}
