import { ApplyOptions } from "@sapphire/decorators";
import { Command, type CommandOptions } from "@sapphire/framework";
import { EmbedBuilder } from "discord.js";
import {
  createFooter,
  fetchJson,
  standardCommandOptions,
} from "../../lib/utils";

import type { PandaApiResponse } from "../../typings/api/animal";

@ApplyOptions<CommandOptions>({
  description: "Pandas.",
  ...standardCommandOptions,
})
export class PandaCommand extends Command {
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
      const { image } = await fetchJson<PandaApiResponse>(
        "https://some-random-api.com/animal/panda"
      );

      const embed = new EmbedBuilder()
        .setColor("Random")
        .setImage(image)
        .setFooter(createFooter(interaction.user));

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      this.container.logger.error("Failed to fetch panda:", error);
      await interaction.editReply({
        content: "Failed to fetch a panda image. Please try again later.",
      });
    }
  }
}
