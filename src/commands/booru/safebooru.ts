import { ApplyOptions } from "@sapphire/decorators";
import { Command, type CommandOptions } from "@sapphire/framework";
import { ApplicationIntegrationType, InteractionContextType } from "discord.js";
import { processBooruRequest } from "../../lib/booru";

@ApplyOptions<CommandOptions>({
  description: "Search images on Safebooru with specified tags.",
  cooldownLimit: 1,
  cooldownDelay: 15000,
  cooldownFilteredUsers: process.env.COOL_PEOPLE_IDS.split(","),
  preconditions: ["NotBlacklisted"],
})
export class GelbooruCommand extends Command {
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
        .addStringOption(option =>
          option
            .setName("tags")
            .setDescription(
              "Autocomplete enabled. Seperate multiple tags with space. E.g: shinano_(azur_lane) thigh_strap"
            )
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addStringOption(option =>
          option
            .setName("mode")
            .setDescription("Booru query mode. Default is Weighted")
            .setChoices(
              { name: "Random - get a random post", value: "random" },
              { name: "Weighted - experimental: get high(er) quality post", value: "weighted" }
            )
        )
    );
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    if (!interaction.deferred) await interaction.deferReply();

    const tags = interaction.options.getString("tags", true);
    const mode = interaction.options.getString("mode");

    await processBooruRequest({
      interaction,
      tags: tags.trim(),
      site: "safebooru",
      noTagsOnReply: false,
      useRandom: mode === "random",
    });
  }
}
