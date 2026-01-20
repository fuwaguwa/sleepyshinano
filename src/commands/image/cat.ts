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
import { CAT_API_URL } from "../../lib/constants";
import { createTextFooter, standardCommandOptions } from "../../lib/utils/command";
import { fetchJson } from "../../lib/utils/http";
import type { CatApiResponse } from "../../typings/api/animal";

@ApplyOptions<CommandOptions>({
  description: "Get an image of a cat!",
  ...standardCommandOptions,
})
export class CatCommand extends Command {
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
      const cat = await fetchJson<CatApiResponse[]>(CAT_API_URL);
      if (!cat) throw new Error("Failed to fetch cat");

      const gallery = new MediaGalleryBuilder().addItems({
        media: {
          url: cat[0].url,
        },
      });
      const footer = new TextDisplayBuilder().setContent(createTextFooter(interaction.user));

      const containerComponent = new ContainerBuilder()
        .addMediaGalleryComponents(gallery)
        .addTextDisplayComponents(footer);

      await interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: [containerComponent] });
    } catch (error) {
      const errorMessage = new TextDisplayBuilder().setContent("❌ | Failed to fetch a cat. Please try again later.");
      const containerComponent = new ContainerBuilder()
        .addTextDisplayComponents(errorMessage)
        .setAccentColor([255, 0, 0]);

      await interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: [containerComponent] });
      throw error;
    }
  }
}
