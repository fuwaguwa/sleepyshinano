import { ApplyOptions } from "@sapphire/decorators";
import { InteractionHandler, type InteractionHandlerOptions, InteractionHandlerTypes } from "@sapphire/framework";
import {
  type ButtonInteraction,
  ContainerBuilder,
  type ContainerComponent,
  type MediaGalleryComponent,
  MessageFlags,
  TextDisplayBuilder,
} from "discord.js";
import { getSauce } from "../../lib/sauce";
import { isTextChannelNonNSFW } from "../../lib/utils";

@ApplyOptions<InteractionHandlerOptions>({
  interactionHandlerType: InteractionHandlerTypes.Button,
})
export class GetSauceButtonHandler extends InteractionHandler {
  public override parse(interaction: ButtonInteraction) {
    if (!interaction.customId.includes("getSauce")) return this.none();
    return this.some();
  }

  public override async run(interaction: ButtonInteraction) {
    try {
      const containerComponent = interaction.message.components[0] as ContainerComponent;
      let media: string;

      try {
        // Tagless booru posts
        media = (containerComponent.components[0] as MediaGalleryComponent).items[0].media.url;
      } catch (_) {
        media = (containerComponent.components[1] as MediaGalleryComponent).items[0].media.url;
      }

      const isEphButton = interaction.customId.split("-")[1] === "eph";
      // Check if this is a TextChannel
      const ephemeral = isEphButton || isTextChannelNonNSFW(interaction);

      await getSauce({ interaction, link: media, ephemeral });
    } catch (error) {
      this.container.logger.error("Error in GetSauceButtonHandler:", error);

      const errorText = new TextDisplayBuilder().setContent("❌ No image found in this message!");
      const containerComponent = new ContainerBuilder().addTextDisplayComponents(errorText);

      return interaction.reply({
        flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
        components: [containerComponent],
      });
    }
  }
}
