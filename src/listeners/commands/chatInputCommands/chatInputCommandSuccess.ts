import { type ChatInputCommandSuccessPayload, Listener } from "@sapphire/framework";
import { logSuccessfulCommand } from "../../../lib/utils/logging";
import User from "../../../schemas/User";

export class ChatInputCommandSuccessListener extends Listener {
  public override async run(payload: ChatInputCommandSuccessPayload) {
    logSuccessfulCommand(payload);

    // Create user entry if they don't exist yet
    await User.findOneAndUpdate(
      { userId: payload.interaction.user.id },
      { $setOnInsert: { userId: payload.interaction.user.id } },
      { upsert: true }
    );
  }
}
