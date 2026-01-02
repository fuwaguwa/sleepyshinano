import { ApplyOptions } from "@sapphire/decorators";
import { Command, type CommandOptions } from "@sapphire/framework";
import { ApplicationIntegrationType, EmbedBuilder, InteractionContextType } from "discord.js";
import { getSauce } from "../../lib/sauce";
import { isImageAndGif } from "../../lib/utils/misc";

@ApplyOptions<CommandOptions>({
  description: "Find sauce for an image/GIF with SauceNAO",
  cooldownLimit: 1,
  cooldownDelay: 15000,
  cooldownFilteredUsers: process.env.COOL_PEOPLE_IDS.split(","),
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

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    if (!interaction.deferred) await interaction.deferReply();

    const link = interaction.options.getString("link");
    const media = interaction.options.getAttachment("media");
    const ERROR_EMBED = new EmbedBuilder().setColor("Red");

    if (!link && !media) {
      ERROR_EMBED.setDescription("❌ | You must provide either a link or an attachment to search for sauce.");
      return interaction.editReply({ embeds: [ERROR_EMBED] });
    }

    // Link takes priority over attachment
    const imageUrl = link ?? (media?.proxyURL as string);

    if (!isImageAndGif(imageUrl)) {
      ERROR_EMBED.setDescription("❌ | The provided link/attachment is not a valid image or GIF.");
      return interaction.editReply({ embeds: [ERROR_EMBED] });
    }

    // Ephemeral if in a non-NSFW TextChannel
    await getSauce({
      interaction,
      link: imageUrl,
      ephemeral: interaction.channel?.type === 0 && !interaction.channel.nsfw,
    });
  }
}
