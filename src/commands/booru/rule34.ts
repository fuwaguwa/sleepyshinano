import { ApplyOptions } from "@sapphire/decorators";
import { Command, type CommandOptions } from "@sapphire/framework";
import { ApplicationIntegrationType, InteractionContextType } from "discord.js";
import { processBooruRequest } from "../../lib/booru";

@ApplyOptions<CommandOptions>({
  description: "Search images on Rule34 with specified tags.",
  cooldownLimit: 1,
  cooldownDelay: 15000,
  cooldownFilteredUsers: process.env.COOL_PEOPLE_IDS?.split(",") || [],
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
        .setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
        .setContexts([
          InteractionContextType.Guild,
          InteractionContextType.BotDM,
          InteractionContextType.PrivateChannel,
        ])
        .addStringOption(option =>
          option
            .setName("tags")
            .setDescription(
              "Autocomplete enabled. Seperate multiple tags with space. E.g: shinano_(azur_lane) thigh_strap"
            )
            .setRequired(true)
            .setAutocomplete(true)
        )
    );
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    if (!interaction.deferred) await interaction.deferReply();

    const tags = interaction.options.getString("tags", true);

    await processBooruRequest({ interaction, tags: tags.trim(), site: "rule34" });
  }
}
