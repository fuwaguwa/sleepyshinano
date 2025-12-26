import { ApplyOptions } from "@sapphire/decorators";
import { Command, type CommandOptions } from "@sapphire/framework";
import { EmbedBuilder } from "discord.js";
import { standardCommandOptions } from "../../lib/utils/command";
import { fetchJson } from "../../lib/utils/http";

import type { DadJokeResponse } from "../../typings/api/misc";

const API_URL = "https://icanhazdadjoke.com/";

@ApplyOptions<CommandOptions>({
  description: "Make a dadjoke",
  ...standardCommandOptions,
})
export class DadjokeCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(builder =>
      builder.setName(this.name).setDescription(this.description)
    );
  }

  public override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction
  ) {
    if (!interaction.deferred) await interaction.deferReply();

    try {
      const { joke } = await fetchJson<DadJokeResponse>(API_URL, {
        headers: { Accept: "application/json" },
      });

      const embed = new EmbedBuilder().setColor("Random").setDescription(joke);

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      this.container.logger.error("Failed to fetch dad joke:", error);
      await interaction.editReply({
        content: "Failed to fetch a dad joke. Please try again later.",
      });
    }
  }
}
