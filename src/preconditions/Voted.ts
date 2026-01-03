import { Precondition } from "@sapphire/framework";
import type { ChatInputCommandInteraction } from "discord.js";
import { getCurrentTimestamp } from "../lib/utils/misc";
import { UserModel } from "../models/User";

export class VotedPrecondition extends Precondition {
  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const coolPeopleIds = process.env.COOL_PEOPLE_IDS.split(",");
    if (coolPeopleIds.includes(interaction.user.id)) return this.ok();

    return this.checkVote(interaction);
  }

  private async checkVote(interaction: ChatInputCommandInteraction) {
    const user = await UserModel.findOne({ userId: interaction.user.id });

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
