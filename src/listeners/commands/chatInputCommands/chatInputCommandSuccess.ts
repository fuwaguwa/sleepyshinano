import { type ChatInputCommandSuccessPayload, Listener } from "@sapphire/framework";
import { logSuccessfulCommand } from "../../../lib/utils/logging";
import { UserModel } from "../../../models/User";

export class ChatInputCommandSuccessListener extends Listener {
  public override async run(payload: ChatInputCommandSuccessPayload) {
    logSuccessfulCommand(payload);

    // Create user entry if they don't exist yet
    await UserModel.updateOne({ userId: payload.interaction.user.id }, { $setOnInsert: {} }, { upsert: true });
  }
}
