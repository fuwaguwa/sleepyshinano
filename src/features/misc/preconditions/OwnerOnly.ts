import { AllFlowsPrecondition } from "@sapphire/framework";
import type { CommandInteraction, ContextMenuCommandInteraction, Message } from "discord.js";
import { SHINANO_CONFIG } from "../../../shared/constants";

export class OwnerOnlyPrecondition extends AllFlowsPrecondition {
  public override async messageRun(message: Message) {
    return this.checkOwner(message.author.id);
  }

  public override async chatInputRun(interaction: CommandInteraction) {
    return this.checkOwner(interaction.user.id);
  }

  public override async contextMenuRun(interaction: ContextMenuCommandInteraction) {
    return this.checkOwner(interaction.user.id);
  }

  private checkOwner(userId: string) {
    const ownerIds = SHINANO_CONFIG.ownerIds;

    return ownerIds.includes(userId)
      ? this.ok()
      : this.error({ message: "ownerOnlyError", identifier: "ownerOnlyError" });
  }
}

// Listener will not be implemented, the command will not respond at all if the user is not an owner.
