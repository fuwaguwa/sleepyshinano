import { ApplyOptions } from "@sapphire/decorators";
import { Command, type CommandOptions } from "@sapphire/framework";
import { EmbedBuilder } from "discord.js";
import {
  createFooter,
  fetchJson,
  standardCommandOptions,
} from "../../lib/utils";

import type { FoxApiResponse } from "../../typings/api/animal";

@ApplyOptions<CommandOptions>({
  description: "Generate an image of a fox!",
  ...standardCommandOptions,
})
export class FoxCommand extends Command {
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
      const { image } = await fetchJson<FoxApiResponse>(
        "https://randomfox.ca/floof/"
      );

      const embed = new EmbedBuilder()
        .setColor("Random")
        .setImage(image)
        .setFooter(createFooter(interaction.user));

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      this.container.logger.error("Failed to fetch fox:", error);
      await interaction.editReply({
        content: "Failed to fetch a fox image. Please try again later.",
      });
    }
  }
}
