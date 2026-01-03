import { ApplyOptions } from "@sapphire/decorators";
import { InteractionHandler, type InteractionHandlerOptions, InteractionHandlerTypes } from "@sapphire/framework";
import { type ButtonInteraction, EmbedBuilder, MessageFlagsBitField } from "discord.js";
import { buttonCooldownCheck, buttonCooldownSet } from "../../lib/collectors";
import { VOTE_LINK_BUTTON } from "../../lib/constants";
import { getCurrentTimestamp } from "../../lib/utils/misc";
import { UserModel } from "../../models/User";
import type { ShinanoUser } from "../../typings/user";

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
    const user = await UserModel.findOne({ userId }).lean<ShinanoUser>();

    buttonCooldownSet("voteCheck", interaction);

    const CANT_VOTE_EMBED = new EmbedBuilder().setColor("Red").setTimestamp();
    const CAN_VOTE_EMBED = new EmbedBuilder().setColor("Green").setTimestamp();

    if (!user?.voteCreatedTimestamp || !user?.voteExpiredTimestamp) {
      if (!user) await UserModel.findOneAndUpdate({ userId }, { $set: { userId } }, { upsert: true });

      CANT_VOTE_EMBED.setDescription(
        "It seems that you have not cast your vote for me! Please do so with the option below!"
      );

      return interaction.reply({
        embeds: [CANT_VOTE_EMBED],
        components: [VOTE_LINK_BUTTON],
        flags: MessageFlagsBitField.Flags.Ephemeral,
      });
    }

    const currentTime = getCurrentTimestamp();

    if (currentTime > user.voteExpiredTimestamp) {
      CAN_VOTE_EMBED.setDescription(
        `Your last vote was <t:${user.voteCreatedTimestamp}:R>, you can now vote again using the button below!`
      );

      await interaction.reply({
        embeds: [CAN_VOTE_EMBED],
        components: [VOTE_LINK_BUTTON],
        flags: MessageFlagsBitField.Flags.Ephemeral,
      });
    } else {
      CANT_VOTE_EMBED.setDescription(
        `Your last vote was <t:${user.voteCreatedTimestamp}:R>, you can vote again <t:${user.voteExpiredTimestamp}:R>`
      );
      await interaction.reply({
        embeds: [CANT_VOTE_EMBED],
        flags: MessageFlagsBitField.Flags.Ephemeral,
      });
    }
  }
}
