import { ApplyOptions } from "@sapphire/decorators";
import { Command, type CommandOptions } from "@sapphire/framework";
import { ApplicationIntegrationType, type ChatInputCommandInteraction, InteractionContextType } from "discord.js";
import { randomItem } from "../../../shared/lib/utils";
import { processBooruRequest } from "../lib/booru";
import type { BooruSite } from "../types/API";

@ApplyOptions<CommandOptions>({
  description: "i love suisei and you should too",
  fullCategory: ["NSFW", "Booru"],
  cooldownDelay: 15000,
  preconditions: ["NotBlacklisted"],
  nsfw: true,
})
export class VtuberCommand extends Command {
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

    const category = randomItem<BooruSite>(["gelbooru", "rule34"]);

    await processBooruRequest({ interaction, tags: "virtual_youtuber", site: category, noTagsOnReply: true });
  }
}
