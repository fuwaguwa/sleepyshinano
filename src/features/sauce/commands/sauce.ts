import { ApplyOptions } from "@sapphire/decorators";
import { Command, type CommandOptions } from "@sapphire/framework";
import {
  ApplicationIntegrationType,
  type ChatInputCommandInteraction,
  EmbedBuilder,
  InteractionContextType,
} from "discord.js";
import { getSauce } from "../lib/sauce";
import { isImageAndGif } from "../lib/utils";

@ApplyOptions<CommandOptions>({
  description: "Find sauce for an image/GIF with SauceNAO",
  cooldownDelay: 15000,
  preconditions: ["NotBlacklisted"],
})
export class SauceCommand extends Command {
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
        .addStringOption(option =>
          option
            .setName("link")
            .setDescription("Link to image. Link will take priority over attachment")
            .setRequired(false)
        )
        .addAttachmentOption(option =>
          option
            .setName("media")
            .setDescription("Image/GIF File. Link will take priority over attachment")
            .setRequired(false)
        )
    );
  }

  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const link = interaction.options.getString("link");
    const media = interaction.options.getAttachment("media");
    const ERROR_EMBED = new EmbedBuilder().setColor("Red");

    if (!link && !media) {
      ERROR_EMBED.setDescription("❌ You must provide either a link or an attachment to search for sauce.");
      return interaction.editReply({ embeds: [ERROR_EMBED] });
    }

    // Link takes priority over attachment
    const imageUrl = link ?? (media?.proxyURL as string);

    if (!isImageAndGif(imageUrl)) {
      ERROR_EMBED.setDescription("❌ The provided link/attachment is not a valid image or GIF.");
      return interaction.editReply({ embeds: [ERROR_EMBED] });
    }

    const isPrivateChannel = interaction.context === InteractionContextType.PrivateChannel;
    const guildTextIsNotNsfw = interaction.channel?.type === 0 && !interaction.channel.nsfw;
    const foreignGuild = !interaction.guild;
    const ephemeralCheck = guildTextIsNotNsfw || isPrivateChannel || foreignGuild;

    await getSauce({
      interaction,
      link: imageUrl,
      ephemeral: ephemeralCheck,
    });
  }
}
