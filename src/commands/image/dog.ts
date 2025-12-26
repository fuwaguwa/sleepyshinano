import { ApplyOptions } from "@sapphire/decorators";
import { Command, type CommandOptions } from "@sapphire/framework";
import { EmbedBuilder } from "discord.js";
import { createFooter, standardCommandOptions } from "../../lib/utils/command";
import { fetchJson } from "../../lib/utils/http";

import type { DogApiResponse } from "../../typings/api/animal";

@ApplyOptions<CommandOptions>({
  description: "Get an image of a dog!",
  ...standardCommandOptions,
})
export class DogCommand extends Command {
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
      const { message } = await fetchJson<DogApiResponse>(
        "https://dog.ceo/api/breeds/image/random"
      );

      const embed = new EmbedBuilder()
        .setColor("Random")
        .setImage(message)
        .setFooter(createFooter(interaction.user));

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      this.container.logger.error("Failed to fetch dog:", error);
      await interaction.editReply({
        content: "Failed to fetch a dog image. Please try again later.",
      });
    }
  }
}
