import { ApplyOptions } from "@sapphire/decorators";
import { Command, type CommandOptions } from "@sapphire/framework";
import { ApplicationIntegrationType, InteractionContextType } from "discord.js";
import { processBooruRequest } from "../../lib/booru";

@ApplyOptions<CommandOptions>({
  description: "Due to popular demands...",
  fullCategory: ["NSFW", "Booru"],
  cooldownLimit: 1,
  cooldownDelay: 15000,
  cooldownFilteredUsers: process.env.COOL_PEOPLE_IDS.split(","),
  preconditions: ["NotBlacklisted"],
  nsfw: true,
})
export class GelbooruCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(builder =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .setNSFW(true)
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

    await processBooruRequest({ interaction, tags: "trap", site: "rule34", noTagsOnReply: true });
  }
}
