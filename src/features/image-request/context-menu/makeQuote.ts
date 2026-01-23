import { ApplyOptions } from "@sapphire/decorators";
import { Command, type CommandOptions, Listener, type ListenerOptions } from "@sapphire/framework";
import {
  ApplicationCommandType,
  ApplicationIntegrationType,
  AttachmentBuilder,
  ContainerBuilder,
  Events,
  type Interaction,
  InteractionContextType,
  MediaGalleryBuilder,
  type MessageContextMenuCommandInteraction,
  MessageFlags,
  TextDisplayBuilder,
} from "discord.js";
import { createQuoteImage } from "../lib/makeQuote";

@ApplyOptions<CommandOptions>({
  description: "Turn an user message into a quote",
  preconditions: ["NotBlacklisted"],
})
export class MakeQuoteContextMenuCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerContextMenuCommand(builder =>
      builder
        .setName("Make this a quote!")
        .setType(ApplicationCommandType.Message)
        .setIntegrationTypes([ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall])
        .setContexts([InteractionContextType.Guild, InteractionContextType.PrivateChannel])
    );
  }
}

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
    const image = new AttachmentBuilder(buffer, { name: "quote.png" });
    const gallery = new MediaGalleryBuilder().addItems([{ media: { url: "attachment://quote.png" } }]);
    const container = new ContainerBuilder().addMediaGalleryComponents(gallery);
    await interaction.editReply({
      flags: MessageFlags.IsComponentsV2,
      components: [container],
      files: [image],
    });
  }
}
