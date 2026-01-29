import { ApplyOptions } from "@sapphire/decorators";
import { Command, type CommandOptions } from "@sapphire/framework";
import {
  type ChatInputCommandInteraction,
  ContainerBuilder,
  MediaGalleryBuilder,
  MessageFlags,
  TextDisplayBuilder,
} from "discord.js";
import { fetchJson } from "../../../shared/lib/http";
import { createTextFooter } from "../../../shared/lib/utils";
import { CAT_API_URL } from "../constants";
import type { CatApiResponse } from "../types/ImageApi";

@ApplyOptions<CommandOptions>({
  description: "Get an image of a cat!",
  cooldownDelay: 5000,
  preconditions: ["NotBlacklisted"],
})
export class CatCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(builder => builder.setName(this.name).setDescription(this.description));
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
