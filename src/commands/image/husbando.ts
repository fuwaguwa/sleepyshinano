import { ApplyOptions } from "@sapphire/decorators";
import { Command, type CommandOptions } from "@sapphire/framework";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";

@ApplyOptions<CommandOptions>({
  description: "Looking for husbandos?",
  cooldownLimit: 1,
  cooldownDelay: 4500,
  cooldownFilteredUsers: process.env.OWNER_IDS?.split(",") || [],
  preconditions: ["NotBlacklisted"],
})
export class HusbandoCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(builder =>
      builder.setName(this.name).setDescription(this.description)
    );
  }

  public override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction
  ) {
    if (!interaction.deferred) await interaction.deferReply();

    try {
      const response = await fetch("https://nekos.best/api/v2/husbando");
      const husbando = await response.json();
      const imageUrl = husbando.results[0].url;

      const husbandoEmbed = new EmbedBuilder()
        .setColor("Random")
        .setFooter({
          text: `Requested by ${interaction.user.username}`,
          iconURL: interaction.user.displayAvatarURL({ forceStatic: false }),
        })
        .setTimestamp()
        .setImage(imageUrl);

      const imageInfo = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setEmoji({ name: "🔗" })
          .setLabel("Image Link")
          .setURL(imageUrl),
        new ButtonBuilder()
          .setStyle(ButtonStyle.Secondary)
          .setEmoji({ name: "🔍" })
          .setLabel("Get Sauce")
          .setCustomId("SAUCE")
      );

      await interaction.editReply({
        embeds: [husbandoEmbed],
        components: [imageInfo],
      });
    } catch (error) {
      this.container.logger.error("Failed to fetch husbando:", error);
      await interaction.editReply({
        content: "Failed to fetch a husbando. Please try again later.",
      });
    }
  }
}
