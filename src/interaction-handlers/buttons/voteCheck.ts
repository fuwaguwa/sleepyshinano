import { ApplyOptions } from "@sapphire/decorators";
import { InteractionHandler, type InteractionHandlerOptions, InteractionHandlerTypes } from "@sapphire/framework";
import { type ButtonInteraction, EmbedBuilder, MessageFlagsBitField } from "discord.js";
import { buttonCooldownCheck, buttonCooldownSet } from "../../lib/collectors";
import { VOTE_LINK_BUTTON } from "../../lib/constants";
import User from "../../schemas/User";
import type { ShinanoUser } from "../../typings/schemas/User";

const CANT_VOTE_EMBED = new EmbedBuilder().setColor("Red").setTimestamp();
const CAN_VOTE_EMBED = new EmbedBuilder().setColor("Green").setTimestamp();

@ApplyOptions<InteractionHandlerOptions>({
  interactionHandlerType: InteractionHandlerTypes.Button,
})
export class VoteCheckButtonHandler extends InteractionHandler {
  public override parse(interaction: ButtonInteraction) {
    if (interaction.customId !== "voteCheck") return this.none();
    return this.some();
  }

  public override async run(interaction: ButtonInteraction) {
    const buttonCooldownStatus = await buttonCooldownCheck("voteCheck", interaction);
    if (buttonCooldownStatus) return;

    const userId = interaction.user.id;
    const user = await User.findOne({ userId }).lean<ShinanoUser>().exec();

    buttonCooldownSet("voteCheck", interaction);

    if (!user?.voteTimestamp) {
      if (!user) {
        await User.findOneAndUpdate({ userId: userId }, { $setOnInsert: { userId: userId } }, { upsert: true });
      }

      CANT_VOTE_EMBED.setDescription(
        "It seems that you have not cast your vote for me! Please do so with the option below!"
      );

      return interaction.reply({
        embeds: [CANT_VOTE_EMBED],
        components: [VOTE_LINK_BUTTON],
        flags: MessageFlagsBitField.Flags.Ephemeral,
      });
    }

    if (Math.floor(Date.now() / 1000) - user.voteTimestamp > 43200) {
      CAN_VOTE_EMBED.setDescription(
        `Your last vote was <t:${user.voteTimestamp}:R>, you can now vote again using the button below!`
      );

      await interaction.reply({
        embeds: [CAN_VOTE_EMBED],
        components: [VOTE_LINK_BUTTON],
        flags: MessageFlagsBitField.Flags.Ephemeral,
      });
    } else {
      CANT_VOTE_EMBED.setDescription(
        `Your last vote was <t:${user.voteTimestamp}:R>, you can vote again <t:${user.voteTimestamp + 43200}:R>`
      );
      await interaction.reply({
        embeds: [CANT_VOTE_EMBED],
        flags: MessageFlagsBitField.Flags.Ephemeral,
      });
    }
  }
}
