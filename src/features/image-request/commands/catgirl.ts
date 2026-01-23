import { ApplyOptions } from "@sapphire/decorators";
import { Command, type CommandOptions } from "@sapphire/framework";
import {
  ApplicationIntegrationType,
  type ChatInputCommandInteraction,
  ContainerBuilder,
  InteractionContextType,
  MediaGalleryBuilder,
  MessageFlags,
  TextDisplayBuilder,
} from "discord.js";
import { fetchJson } from "../../../shared/lib/http";
import { createTextFooter } from "../../../shared/lib/utils";
import type { NekosBestResponse } from "../../fun/types/API";
import { CATGIRL_API_URL } from "../constants";

@ApplyOptions<CommandOptions>({
  description: "Get a pic of a catgirl (SFW)",
  cooldownDelay: 10000,
  preconditions: ["NotBlacklisted"],
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

  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    if (!interaction.deferred) await interaction.deferReply();

    try {
      const catgirl = await fetchJson<NekosBestResponse>(CATGIRL_API_URL);
      if (!catgirl || !catgirl.results) throw new Error("Failed to fetch catgirl");

      const imageUrl = catgirl.results[0].url;
      const gallery = new MediaGalleryBuilder().addItems({
        media: {
          url: imageUrl,
        },
      });
      const footer = new TextDisplayBuilder().setContent(createTextFooter(interaction.user));

      const containerComponent = new ContainerBuilder()
        .addMediaGalleryComponents(gallery)
        .addTextDisplayComponents(footer);

      await interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: [containerComponent] });
    } catch (error) {
      const errorMessage = new TextDisplayBuilder().setContent("❌ Failed to fetch a catgirl. Please try again later.");
      const containerComponent = new ContainerBuilder()
        .addTextDisplayComponents(errorMessage)
        .setAccentColor([255, 0, 0]);

      await interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: [containerComponent] });
      throw error;
    }
  }
}
