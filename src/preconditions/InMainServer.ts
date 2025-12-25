import { Precondition } from "@sapphire/framework";
import type { ChatInputCommandInteraction } from "discord.js";

export class InMainServerPrecondition extends Precondition {
  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    // Check if user is in cool people list (bypass server requirement)
    const coolPeopleIds = process.env.COOL_PEOPLE_IDS?.split(",") || [];
    if (coolPeopleIds.includes(interaction.user.id)) {
      return this.ok();
    }

    return await this.checkMutualServer(interaction);
  }

  private async checkMutualServer(interaction: ChatInputCommandInteraction) {
    const mainGuildId = process.env.MAIN_GUILD_ID;

    if (!mainGuildId) {
      this.container.logger.warn("MAIN_GUILD_ID not set, skipping server check");
      return this.ok();
    }

    try {
      const guild = await this.container.client.guilds.fetch(mainGuildId);
      await guild.members.fetch(interaction.user.id);
      return this.ok();
    } catch (error) {
      return this.error({ identifier: "inMainServerError" });
    }
  }
}
