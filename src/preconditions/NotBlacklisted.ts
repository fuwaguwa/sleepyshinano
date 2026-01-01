import { ApplyOptions } from "@sapphire/decorators";
import { Precondition, type PreconditionOptions } from "@sapphire/framework";
import type { ChatInputCommandInteraction } from "discord.js";
import User from "../schemas/User";

@ApplyOptions<PreconditionOptions>({
  position: 20,
})
export class NotBlacklistedPrecondition extends Precondition {
  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const user = await User.findOne({ userId: interaction.user.id }).lean();
    if (!user) return this.ok();

    return user.blacklisted ? this.error({ identifier: "blacklisted" }) : this.ok();
  }
}
