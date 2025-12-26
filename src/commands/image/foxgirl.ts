import { ApplyOptions } from "@sapphire/decorators";
import { Command, type CommandOptions } from "@sapphire/framework";
import { EmbedBuilder } from "discord.js";
import {
  createFooter,
  createImageActionRow,
  standardCommandOptions,
} from "../../lib/utils/command";
import { fetchJson } from "../../lib/utils/http";

import type { NekosBestResponse } from "../../typings/api/misc";

@ApplyOptions<CommandOptions>({
  description: "If you love me, you'll love them too (SFW)",
  ...standardCommandOptions,
})
export class FoxgirlCommand extends Command {
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
        "https://nekos.best/api/v2/kitsune"
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
      this.container.logger.error("Failed to fetch foxgirl:", error);
      await interaction.editReply({
        content: "Failed to fetch a foxgirl. Please try again later.",
      });
    }
  }
}
