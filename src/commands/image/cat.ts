import { ApplyOptions } from "@sapphire/decorators";
import { Command, type CommandOptions } from "@sapphire/framework";
import { EmbedBuilder } from "discord.js";
import {
  createFooter,
  fetchJson,
  standardCommandOptions,
} from "../../lib/utils";

interface CatApiResponse {
  url: string;
}

@ApplyOptions<CommandOptions>({
  description: "Get an image of a cat!",
  ...standardCommandOptions,
})
export class CatCommand extends Command {
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
      const [data] = await fetchJson<CatApiResponse[]>(
        "https://api.thecatapi.com/v1/images/search"
      );

      const embed = new EmbedBuilder()
        .setColor("Random")
        .setImage(data.url)
        .setFooter(createFooter(interaction.user));

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      this.container.logger.error("Failed to fetch cat:", error);
      await interaction.editReply({
        content: "Failed to fetch a cat. Please try again later.",
      });
    }
  }
}
