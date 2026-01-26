import { Precondition } from "@sapphire/framework";
import type { ChatInputCommandInteraction } from "discord.js";
import { IMMUNE_IDS } from "../../../shared/constants";
import { getCurrentTimestamp } from "../../../shared/lib/utils";
import { UserVoteModel } from "../models/UserVote";

export class VotedPrecondition extends Precondition {
  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    if (IMMUNE_IDS.includes(interaction.user.id)) return this.ok();

    return this.checkVote(interaction);
  }

  private async checkVote(interaction: ChatInputCommandInteraction) {
    const user = await UserVoteModel.findOne({ userId: interaction.user.id });

    // User hasn't voted yet
    if (!user?.voteCreatedTimestamp || !user?.voteExpiredTimestamp)
      return this.error({ message: "noVote", identifier: "votedError" });

    const currentTime = getCurrentTimestamp();

    // Vote is still valid
    if (currentTime < user.voteExpiredTimestamp) return this.ok();

    // Vote expired
    return this.error({
      message: `exp-${user.voteCreatedTimestamp}`,
      identifier: "votedError",
    });
  }
}
