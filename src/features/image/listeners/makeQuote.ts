import { ApplyOptions } from "@sapphire/decorators";
import { Events, Listener, type ListenerOptions } from "@sapphire/framework";
import {
  AttachmentBuilder,
  ContainerBuilder,
  type Interaction,
  MediaGalleryBuilder,
  type MessageContextMenuCommandInteraction,
  MessageFlags,
  TextDisplayBuilder,
} from "discord.js";
import { createQuoteImage } from "../lib/makeQuote";

@ApplyOptions<ListenerOptions>({
  event: Events.InteractionCreate,
})
export class MakeQuoteContextMenuListener extends Listener {
  public async run(interaction: Interaction) {
    if (!interaction.isMessageContextMenuCommand()) return;
    if (interaction.commandName !== "Make this a quote!") return;

    await this.handleMakeQuote(interaction);
  }

  private async handleMakeQuote(interaction: MessageContextMenuCommandInteraction) {
    if (!interaction.deferred) await interaction.deferReply();

    const content = interaction.targetMessage.content;

    if (!content) {
      const errorMessage = new TextDisplayBuilder().setContent("❌ | This message does not contain any text!");
      const errorContainer = new ContainerBuilder().addTextDisplayComponents(errorMessage).setAccentColor([255, 0, 0]);
      return interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [errorContainer],
      });
    }

    const user = interaction.targetMessage.author;
    const username = user.username;
    const avatarUrl = user.displayAvatarURL({ extension: "png", size: 512, forceStatic: true });

    const buffer = await createQuoteImage({ text: content, username, avatarUrl });
    const image = new AttachmentBuilder(buffer, { name: "quote.gif" });
    const gallery = new MediaGalleryBuilder().addItems([{ media: { url: "attachment://quote.gif" } }]);
    const container = new ContainerBuilder().addMediaGalleryComponents(gallery);
    await interaction.editReply({
      flags: MessageFlags.IsComponentsV2,
      components: [container],
      files: [image],
    });
  }
}
