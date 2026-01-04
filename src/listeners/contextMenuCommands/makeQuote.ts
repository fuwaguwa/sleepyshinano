import { ApplyOptions } from "@sapphire/decorators";
import { Listener, type ListenerOptions } from "@sapphire/framework";
import {
  AttachmentBuilder,
  EmbedBuilder,
  Events,
  type Interaction,
  type MessageContextMenuCommandInteraction,
} from "discord.js";
import { createQuoteImage } from "../../lib/makeQuote";

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
      const errorEmbed = new EmbedBuilder()
        .setColor("Red")
        .setDescription("❌ | This message does not contain any text!");
      return interaction.editReply({ embeds: [errorEmbed] });
    }

    const user = interaction.targetMessage.author;
    const username = user.username;
    const avatarUrl = user.displayAvatarURL({ extension: "png", size: 512, forceStatic: true });

    const buffer = await createQuoteImage({ text: content, username, avatarUrl });
    const image = new AttachmentBuilder(buffer, { name: "quote.png" });

    await interaction.editReply({ files: [image] });
  }
}
