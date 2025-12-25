import { type ChatInputCommandSuccessPayload, Listener } from "@sapphire/framework";
import { logSuccessfulCommand } from "../../../lib/utils";
import User from "../../../schemas/User";

export class ChatInputCommandSuccessListener extends Listener {
  public override async run(payload: ChatInputCommandSuccessPayload) {
    logSuccessfulCommand(payload);

    // Create user entry if they don't exist yet
    try {
      await User.findOneAndUpdate(
        { userId: payload.interaction.user.id },
        { $setOnInsert: { userId: payload.interaction.user.id } },
        { upsert: true }
      );
    } catch (error) {
      this.container.logger.error("Failed to create user entry: ", error);
    }
  }
}
