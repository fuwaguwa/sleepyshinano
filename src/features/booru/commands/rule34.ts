import { ApplyOptions } from "@sapphire/decorators";
import { Command, type CommandOptions } from "@sapphire/framework";
import { ApplicationIntegrationType, type ChatInputCommandInteraction, InteractionContextType } from "discord.js";
import { processBooruRequest } from "../lib/booru";

@ApplyOptions<CommandOptions>({
  description: "Search images on Rule34 with specified tags.",
  fullCategory: ["NSFW", "Booru"],
  cooldownDelay: 15000,
  preconditions: ["NotBlacklisted"],
  nsfw: true,
})
export class Rule34Command extends Command {
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

  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    if (!interaction.deferred) await interaction.deferReply();
    const mode = interaction.options.getString("mode");

    const tags = interaction.options.getString("tags", true);

    await processBooruRequest({
      interaction,
      tags: tags.trim(),
      site: "rule34",
      noTagsOnReply: false,
      useRandom: mode === "random",
    });
  }
}
