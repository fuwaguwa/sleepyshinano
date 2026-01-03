import { ApplyOptions } from "@sapphire/decorators";
import { Command, type CommandOptions } from "@sapphire/framework";
import {
  ApplicationIntegrationType,
  type ChatInputCommandInteraction,
  EmbedBuilder,
  InteractionContextType,
} from "discord.js";
import { DOG_API_URL } from "../../lib/constants";
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
      const dog = await fetchJson<DogApiResponse>(DOG_API_URL);

      if (!dog || !dog.message) throw new Error("Failed to fetch dog image");

      const embed = new EmbedBuilder()
        .setColor("Random")
        .setImage(dog.message)
        .setFooter(createFooter(interaction.user));

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      const errorEmbed = new EmbedBuilder()
        .setColor("Red")
        .setDescription("❌ | Failed to fetch a dog image. Please try again later.");
      await interaction.editReply({ embeds: [errorEmbed] });
      throw error;
    }
  }
}
