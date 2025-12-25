import { Precondition } from "@sapphire/framework";
import type { ChatInputCommandInteraction } from "discord.js";
import User from "../schemas/User";

export class VotedPrecondition extends Precondition {
  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    // Check if user is in cool people list (bypass vote requirement)
    const coolPeopleIds = process.env.COOL_PEOPLE_IDS?.split(",") || [];
    if (coolPeopleIds.includes(interaction.user.id)) {
      return this.ok();
    }

    return await this.checkVote(interaction);
  }

  private async checkVote(interaction: ChatInputCommandInteraction) {
    const user = await User.findOne({ userId: interaction.user.id });

    // User hasn't voted yet
    if (!user?.lastVoteTimestamp) {
      return this.error({ message: "noVote", identifier: "votedError" });
    }

    const now = Math.floor(Date.now() / 1000);
    const timeSinceVote = now - user.lastVoteTimestamp;
    const voteValidDuration = 43200; // 12 hours in seconds

    // Vote is still valid
    if (timeSinceVote <= voteValidDuration) {
      return this.ok();
    }

    // Vote expired
    return this.error({
      message: `exp-${user.lastVoteTimestamp}`,
      identifier: "votedError",
    });
  }
}
