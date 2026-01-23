import { ApplyOptions } from "@sapphire/decorators";
import { Command, type CommandOptions } from "@sapphire/framework";
import { ApplicationIntegrationType, type ChatInputCommandInteraction, InteractionContextType } from "discord.js";
import { processBooruRequest } from "../lib/booru";

@ApplyOptions<CommandOptions>({
  description: "sticky",
  fullCategory: ["NSFW", "Booru"],
  cooldownDelay: 15000,
  preconditions: ["NotBlacklisted"],
  nsfw: true,
})
export class BukkakeCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(builder =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .setNSFW(true)
        .setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
        .setContexts([InteractionContextType.Guild])
    );
  }

  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    if (!interaction.deferred) await interaction.deferReply();

    await processBooruRequest({
      interaction,
      tags: "bukkake -yaoi",
      site: "gelbooru",
      noTagsOnReply: true,
    });
  }
}
