import { ApplyOptions } from "@sapphire/decorators";
import { InteractionHandler, type InteractionHandlerOptions, InteractionHandlerTypes } from "@sapphire/framework";
import { type ButtonInteraction, EmbedBuilder, MessageFlagsBitField, TextChannel } from "discord.js";
import { getSauce } from "../../lib/sauce";

@ApplyOptions<InteractionHandlerOptions>({
  interactionHandlerType: InteractionHandlerTypes.Button,
})
export class GetSauceButtonHandler extends InteractionHandler {
  public override parse(interaction: ButtonInteraction) {
    if (!interaction.customId.includes("getSauce")) return this.none();
    return this.some();
  }

  public override async run(interaction: ButtonInteraction) {
    const link = interaction.message.embeds[0]?.image?.url;

    if (!link) {
      const embed = new EmbedBuilder()
        .setColor("Red")
        .setDescription("❌ | Could not find an image in the message!")
        .setTimestamp();
      return interaction.reply({ embeds: [embed], flags: MessageFlagsBitField.Flags.Ephemeral });
    }

    this.container.logger.debug(interaction.channel);

    const isEphButton = interaction.customId.split("-")[1] === "eph";
    // Check if this is a TextChannel
    const isTextChannelNonNSFW = interaction.channel?.type === 0 && !interaction.channel.nsfw;
    const ephemeral = isEphButton || isTextChannelNonNSFW;

    await getSauce({ interaction, link, ephemeral });
  }
}
