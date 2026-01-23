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
import { getCurrentTimestamp } from "../../../shared/lib/utils";

@ApplyOptions<CommandOptions>({
  description: "Get an user's avatar",
  preconditions: ["NotBlacklisted"],
  cooldownDelay: 3000,
})
export class AvatarCommand extends Command {
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
        .addUserOption(option => option.setName("user").setDescription("The user you want the command to be ran on."))
    );
  }

  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser("user") || interaction.user;

    const baseUrl = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}`;
    const isAnimated = user.avatar?.startsWith("a_");
    const description = isAnimated
      ? `[.gif](${baseUrl}.gif?size=1024) | [.webp](${baseUrl}.webp?size=1024)`
      : `[.jpg](${baseUrl}.jpg?size=1024) | [.png](${baseUrl}.png?size=1024) | [.webp](${baseUrl}.webp?size=1024)`;
    const displayUrl = isAnimated ? `${baseUrl}.gif?size=1024` : `${baseUrl}.png?size=1024`;

    const titleText = new TextDisplayBuilder().setContent(`## ${user.username}'s Avatar`);
    const avatarFormat = new TextDisplayBuilder().setContent(description);
    const footer = new TextDisplayBuilder().setContent(
      `-# UID: ${user.id} | Requested by ${interaction.user} | <t:${getCurrentTimestamp()}:R>`
    );

    const avatarGallery = new MediaGalleryBuilder().addItems([
      {
        media: {
          url: displayUrl,
        },
      },
    ]);

    const containerComponent = new ContainerBuilder()
      .addTextDisplayComponents(titleText, avatarFormat)
      .addMediaGalleryComponents(avatarGallery)
      .addTextDisplayComponents(footer);

    await interaction.reply({ flags: MessageFlags.IsComponentsV2, components: [containerComponent] });
  }
}
