import { ApplyOptions } from "@sapphire/decorators";
import { Precondition, type PreconditionOptions } from "@sapphire/framework";
import type { ChatInputCommandInteraction } from "discord.js";
import { UserModel } from "../models/User";

@ApplyOptions<PreconditionOptions>({
  position: 20,
})
export class NotBlacklistedPrecondition extends Precondition {
  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const user = await UserModel.findOne({ userId: interaction.user.id });
    if (!user) return this.ok();

    return user.blacklisted ? this.error({ identifier: "blacklisted" }) : this.ok();
  }
}
