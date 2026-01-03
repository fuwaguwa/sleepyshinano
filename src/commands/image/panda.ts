import { ApplyOptions } from "@sapphire/decorators";
import { Command, type CommandOptions } from "@sapphire/framework";
import {
  ApplicationIntegrationType,
  type ChatInputCommandInteraction,
  EmbedBuilder,
  InteractionContextType,
} from "discord.js";
import { createFooter, standardCommandOptions } from "../../lib/utils/command";
import { buildSraUrl, fetchJson } from "../../lib/utils/http";
import type { PandaApiResponse } from "../../typings/api/animal";

@ApplyOptions<CommandOptions>({
  description: "Pandas.",
  ...standardCommandOptions,
})
export class PandaCommand extends Command {
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
      const panda = await fetchJson<PandaApiResponse>(buildSraUrl("animal/panda"));

      if (!panda || !panda.image) throw new Error("Failed to fetch panda image");

      const embed = new EmbedBuilder()
        .setColor("Random")
        .setImage(panda.image)
        .setFooter(createFooter(interaction.user));

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      const errorEmbed = new EmbedBuilder()
        .setColor("Red")
        .setDescription("❌ | Failed to fetch a panda image. Please try again later.");
      await interaction.editReply({ embeds: [errorEmbed] });
      throw error;
    }
  }
}
