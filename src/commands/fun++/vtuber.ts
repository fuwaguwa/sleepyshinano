import { ApplyOptions } from "@sapphire/decorators";
import { Command, type CommandOptions } from "@sapphire/framework";
import { processBooruRequest } from "../../lib/booru";
import { randomItem } from "../../lib/utils/misc";
import type { BooruSite } from "../../typings/api/booru";

@ApplyOptions<CommandOptions>({
  description: "i love suisei and you should too",
  fullCategory: ["NSFW", "Booru"],
  cooldownLimit: 1,
  cooldownDelay: 15000,
  cooldownFilteredUsers: process.env.COOL_PEOPLE_IDS.split(",") || [],
  preconditions: ["NotBlacklisted"],
  nsfw: true,
})
export class GelbooruCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(builder =>
      builder.setName(this.name).setDescription(this.description).setNSFW(true)
    );
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    if (!interaction.deferred) await interaction.deferReply();

    const category = randomItem<BooruSite>(["gelbooru", "rule34"]);

    await processBooruRequest({ interaction, tags: "virtual_youtuber", site: category, noTagsOnReply: true });
  }
}
