import { ApplyOptions } from "@sapphire/decorators";
import { InteractionHandler, type InteractionHandlerOptions, InteractionHandlerTypes } from "@sapphire/framework";
import {
  type ButtonInteraction,
  ContainerBuilder,
  MessageFlags,
  SeparatorBuilder,
  TextDisplayBuilder,
} from "discord.js";
import { VOTE_LINK_BUTTON } from "../../../../shared/constants";
import { checkButtonCooldownCache, setButtonCooldownCache } from "../../../../shared/lib/cooldown";
import { getCurrentTimestamp } from "../../../../shared/lib/utils";
import { UserVoteModel } from "../../models/UserVote";
import type { ShinanoUserVote } from "../../types/UserVote";

@ApplyOptions<InteractionHandlerOptions>({
  interactionHandlerType: InteractionHandlerTypes.Button,
})
export class VoteCheckButtonHandler extends InteractionHandler {
  public override parse(interaction: ButtonInteraction) {
    if (interaction.customId !== "voteCheck") return this.none();
    return this.some();
  }

  public override async run(interaction: ButtonInteraction) {
    const buttonCooldownStatus = await checkButtonCooldownCache("voteCheck", interaction);
    if (buttonCooldownStatus) return;

    const userId = interaction.user.id;
    const user = await UserVoteModel.findOne({ userId }).lean<ShinanoUserVote>();

    setButtonCooldownCache("voteCheck", interaction);

    if (!user?.voteCreatedTimestamp || !user?.voteExpiredTimestamp) {
      if (!user) await UserVoteModel.findOneAndUpdate({ userId }, { $set: { userId } }, { upsert: true });

      const cantVoteText = new TextDisplayBuilder().setContent(
        "## Vote Required\nIt seems that you have not cast your vote for me! Please do so with the option below!"
      );
      const cantVoteButton = VOTE_LINK_BUTTON;
      const separator = new SeparatorBuilder();
      const cantVoteContainer = new ContainerBuilder()
        .addTextDisplayComponents(cantVoteText)
        .addSeparatorComponents(separator)
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
      const separator = new SeparatorBuilder();
      const canVoteContainer = new ContainerBuilder()
        .addTextDisplayComponents(canVoteText)
        .addSeparatorComponents(separator)
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
