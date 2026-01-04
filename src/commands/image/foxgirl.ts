import { ApplyOptions } from "@sapphire/decorators";
import { Command, type CommandOptions } from "@sapphire/framework";
import {
  ApplicationIntegrationType,
  type ChatInputCommandInteraction,
  EmbedBuilder,
  InteractionContextType,
} from "discord.js";
import { FOXGIRL_API_URL } from "../../lib/constants";
import { createFooter, createImageActionRow, standardCommandOptions } from "../../lib/utils/command";
import { fetchJson } from "../../lib/utils/http";
import type { NekosBestResponse } from "../../typings/api/misc";

@ApplyOptions<CommandOptions>({
  description: "If you love me, you'll love them too (SFW)",
  ...standardCommandOptions,
})
export class FoxgirlCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(builder =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .setIntegrationTypes([ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall])
        .setContexts([
          InteractionContextType.Guild,
          InteractionContextType.BotDM,
          InteractionContextType.PrivateChannel,
        ])
    );
  }

  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    if (!interaction.deferred) await interaction.deferReply();

    try {
      const foxgirl = await fetchJson<NekosBestResponse>(FOXGIRL_API_URL);

      if (!foxgirl || !foxgirl.results) throw new Error("Failed to fetch foxgirl");

      const imageUrl = foxgirl.results[0].url;

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
      const errorEmbed = new EmbedBuilder()
        .setColor("Red")
        .setDescription("❌ | Failed to fetch a foxgirl. Please try again later.");
      await interaction.editReply({ embeds: [errorEmbed] });
      throw error;
    }
  }
}
