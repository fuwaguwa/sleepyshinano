import { Precondition } from "@sapphire/framework";
import type { ChatInputCommandInteraction } from "discord.js";
import { IMMUNE_IDS, MAIN_GUILD_ID } from "../../shared/constants";

export class InMainServerPrecondition extends Precondition {
  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    if (IMMUNE_IDS.includes(interaction.user.id)) return this.ok();

    return this.checkMutualServer(interaction);
  }

  private async checkMutualServer(interaction: ChatInputCommandInteraction) {
    try {
      const guild = await this.container.client.guilds.fetch(MAIN_GUILD_ID);
      await guild.members.fetch(interaction.user.id);
      return this.ok();
    } catch (_) {
      return this.error({ identifier: "inMainServerError" });
    }
  }
}
