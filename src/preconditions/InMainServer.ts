import { Precondition } from "@sapphire/framework";
import type { ChatInputCommandInteraction } from "discord.js";

const mainGuildId = "1020960562710052895";
export class InMainServerPrecondition extends Precondition {
  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    // Check if user is in cool people list (bypass server requirement)
    const coolPeopleIds = process.env.COOL_PEOPLE_IDS.split(",") || [];
    if (coolPeopleIds.includes(interaction.user.id)) {
      return this.ok();
    }

    return await this.checkMutualServer(interaction);
  }

  private async checkMutualServer(interaction: ChatInputCommandInteraction) {
    if (process.env.COOL_PEOPLE_IDS.split(",").includes(interaction.user.id)) return this.ok();

    try {
      const guild = await this.container.client.guilds.fetch(mainGuildId);
      await guild.members.fetch(interaction.user.id);
      return this.ok();
    } catch (_) {
      return this.error({ identifier: "inMainServerError" });
    }
  }
}
