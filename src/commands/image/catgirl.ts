import { ApplyOptions } from "@sapphire/decorators";
import { Command, type CommandOptions } from "@sapphire/framework";
import { ApplicationIntegrationType, EmbedBuilder, InteractionContextType } from "discord.js";
import { createFooter, createImageActionRow, standardCommandOptions } from "../../lib/utils/command";
import { fetchJson } from "../../lib/utils/http";
import type { NekosBestResponse } from "../../typings/api/misc";

const CATGIRL_API_URL = "https://nekos.best/api/v2/neko";

@ApplyOptions<CommandOptions>({
  description: "Get a pic of a catgirl (SFW)",
  ...standardCommandOptions,
})
export class CatgirlCommand extends Command {
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
      const catgirl = await fetchJson<NekosBestResponse>(CATGIRL_API_URL);

      if (!catgirl || !catgirl.results) throw new Error("Failed to fetch catgirl");

      const imageUrl = catgirl.results[0].url;

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
        .setDescription("❌ | Failed to fetch a catgirl. Please try again later.");
      await interaction.editReply({ embeds: [errorEmbed] });
      throw error;
    }
  }
}
