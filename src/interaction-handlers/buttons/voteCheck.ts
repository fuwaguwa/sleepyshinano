import { ApplyOptions } from "@sapphire/decorators";
import { InteractionHandler, type InteractionHandlerOptions, InteractionHandlerTypes } from "@sapphire/framework";
import {
  ActionRowBuilder,
  ButtonBuilder,
  type ButtonInteraction,
  ContainerBuilder,
  MessageFlags,
  SeparatorBuilder,
  TextDisplayBuilder,
} from "discord.js";
import { buttonCooldownCheck, buttonCooldownSet } from "../../lib/collectors";
import { VOTE_LINK_BUTTON } from "../../lib/constants";
import { getCurrentTimestamp } from "../../lib/utils/misc";
import { UserModel } from "../../models/User";
import type { ShinanoUser } from "../../typings/models/User";

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

    if (!user?.voteCreatedTimestamp || !user?.voteExpiredTimestamp) {
      if (!user) await UserModel.findOneAndUpdate({ userId }, { $set: { userId } }, { upsert: true });

      const cantVoteText = new TextDisplayBuilder().setContent(
        "## Vote Required\nIt seems that you have not cast your vote for me! Please do so with the option below!"
      );
      const cantVoteButton = VOTE_LINK_BUTTON;
      const cantVoteContainer = new ContainerBuilder()
        .addTextDisplayComponents(cantVoteText)
        .addSeparatorComponents(new SeparatorBuilder())
        .addActionRowComponents(cantVoteButton)
        .setAccentColor([255, 0, 0]);

      return interaction.reply({
        components: [cantVoteContainer],
        flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
      });
    }

    const currentTime = getCurrentTimestamp();

    if (currentTime > user.voteExpiredTimestamp) {
      const canVoteText = new TextDisplayBuilder().setContent(
        `## Vote Again!\nYour last vote was <t:${user.voteCreatedTimestamp}:R>, you can now vote again using the button below!`
      );
      const canVoteButton = VOTE_LINK_BUTTON;
      const canVoteContainer = new ContainerBuilder()
        .addTextDisplayComponents(canVoteText)
        .addSeparatorComponents(new SeparatorBuilder())
        .addActionRowComponents(canVoteButton)
        .setAccentColor([0, 255, 0]);

      await interaction.reply({
        components: [canVoteContainer],
        flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
      });
    } else {
      const cantVoteText = new TextDisplayBuilder().setContent(
        `## Vote Cooldown\nYour last vote was <t:${user.voteCreatedTimestamp}:R>, you can vote again <t:${user.voteExpiredTimestamp}:R>`
      );
      const cantVoteContainer = new ContainerBuilder()
        .addTextDisplayComponents(cantVoteText)
        .setAccentColor([255, 0, 0]);

      await interaction.reply({
        components: [cantVoteContainer],
        flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
      });
    }
  }
}
