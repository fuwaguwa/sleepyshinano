import { ApplyOptions } from "@sapphire/decorators";
import { Command, type CommandOptions } from "@sapphire/framework";
import { ApplicationIntegrationType, EmbedBuilder, InteractionContextType } from "discord.js";
import { createFooter, standardCommandOptions } from "../../lib/utils/command";
import { fetchJson } from "../../lib/utils/http";

import type { FoxApiResponse } from "../../typings/api/animal";

@ApplyOptions<CommandOptions>({
  description: "Generate an image of a fox!",
  ...standardCommandOptions,
})
export class FoxCommand extends Command {
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

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    if (!interaction.deferred) await interaction.deferReply();

    try {
      const { image } = await fetchJson<FoxApiResponse>("https://randomfox.ca/floof/");

      const embed = new EmbedBuilder().setColor("Random").setImage(image).setFooter(createFooter(interaction.user));

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      const errorEmbed = new EmbedBuilder()
        .setColor("Red")
        .setDescription("❌ | Failed to fetch a fox image. Please try again later.");
      await interaction.editReply({ embeds: [errorEmbed] });
      throw error;
    }
  }
}
