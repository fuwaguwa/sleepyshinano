import { ApplyOptions } from "@sapphire/decorators";
import { Command, type CommandOptions } from "@sapphire/framework";
import { EmbedBuilder } from "discord.js";
import {
  createFooter,
  createImageActionRow,
  fetchJson,
  standardCommandOptions,
} from "../../lib/utils";

import type { NekosBestResponse } from "../../typings/api/misc";

@ApplyOptions<CommandOptions>({
  description: "Looking for waifus?",
  ...standardCommandOptions,
})
export class WaifuCommand extends Command {
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
      const { results } = await fetchJson<NekosBestResponse>(
        "https://nekos.best/api/v2/waifu"
      );
      const imageUrl = results[0].url;

      const embed = new EmbedBuilder()
        .setColor("Random")
        .setFooter(createFooter(interaction.user))
        .setTimestamp()
        .setImage(imageUrl);

      await interaction.editReply({
        embeds: [embed],
        components: [createImageActionRow(imageUrl)],
      });
    } catch (error) {
      this.container.logger.error("Failed to fetch waifu:", error);
      await interaction.editReply({
        content: "Failed to fetch a waifu. Please try again later.",
      });
    }
  }
}
