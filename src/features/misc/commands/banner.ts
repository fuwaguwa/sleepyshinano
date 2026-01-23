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
import { getCurrentTimestamp } from "../../../shared/lib/utils";
import type { DiscordUserResponse } from "../../fun/types/API";

@ApplyOptions<CommandOptions>({
  description: "Get a user's banner",
  preconditions: ["NotBlacklisted"],
  cooldownDelay: 3000,
})
export class BannerCommand extends Command {
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
        .addUserOption(option => option.setName("user").setDescription("The user to get the banner from"))
    );
  }

  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser("user") || interaction.user;

    if (!interaction.deferred) await interaction.deferReply();

    try {
      const data = await fetchJson<DiscordUserResponse>(`https://discord.com/api/v10/users/${user.id}`, {
        headers: { Authorization: `Bot ${process.env.BOT_TOKEN}` },
      });

      if (!data) throw new Error("Failed to fetch data from Discord API.");

      if (!data.banner) {
        const errorMessage = new TextDisplayBuilder().setContent("❌ User does not have a banner.");
        const errorContainer = new ContainerBuilder()
          .addTextDisplayComponents(errorMessage)
          .setAccentColor([255, 0, 0]);
        return interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: [errorContainer] });
      }

      const baseUrl = `https://cdn.discordapp.com/banners/${user.id}/${data.banner}`;
      const isAnimated = data.banner?.startsWith("a_");
      const description = isAnimated
        ? `[.gif](${baseUrl}.gif?size=1024) | [.webp](${baseUrl}.webp?size=1024)`
        : `[.jpg](${baseUrl}.jpg?size=1024) | [.png](${baseUrl}.png?size=1024) | [.webp](${baseUrl}.webp?size=1024)`;
      const displayUrl = isAnimated ? `${baseUrl}.gif?size=1024` : `${baseUrl}.png?size=1024`;

      const titleText = new TextDisplayBuilder().setContent(`## ${user.username}'s Banner`);
      const avatarFormatText = new TextDisplayBuilder().setContent(description);
      const bannerGallery = new MediaGalleryBuilder().addItems([
        {
          media: {
            url: displayUrl,
          },
        },
      ]);
      const footer = new TextDisplayBuilder().setContent(
        `-# UID: ${user.id} | Requested by ${interaction.user} | <t:${getCurrentTimestamp()}:R>`
      );

      const containerComponent = new ContainerBuilder()
        .addTextDisplayComponents(titleText, avatarFormatText)
        .addMediaGalleryComponents(bannerGallery)
        .addTextDisplayComponents(footer);

      await interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: [containerComponent] });
    } catch (error) {
      const errorMessage = new TextDisplayBuilder().setContent("❌ Failed to fetch the user's banner");
      const errorContainer = new ContainerBuilder().addTextDisplayComponents(errorMessage).setAccentColor([255, 0, 0]);
      await interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: [errorContainer] });
      throw error;
    }
  }
}
