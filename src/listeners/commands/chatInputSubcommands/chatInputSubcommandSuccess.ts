import { Listener, LogLevel } from "@sapphire/framework";
import type { Logger } from "@sapphire/plugin-logger";
import type {
  ChatInputCommandSubcommandMappingMethod,
  ChatInputSubcommandSuccessPayload,
  SubcommandPluginEvents,
} from "@sapphire/plugin-subcommands";
import type { Interaction } from "discord.js";
import { logSuccessfulCommand } from "../../../lib/utils/logging";
import { UserModel } from "../../../models/User";

export class ChatInputSubcommandSuccessListener extends Listener<
  typeof SubcommandPluginEvents.ChatInputSubcommandSuccess
> {
  public override async run(
    _interaction: Interaction,
    subcommand: ChatInputCommandSubcommandMappingMethod,
    payload: ChatInputSubcommandSuccessPayload
  ) {
    logSuccessfulCommand(payload, subcommand);

    // Create user entry if they don't exist yet
    await UserModel.updateOne({ userId: payload.interaction.user.id }, { $setOnInsert: {} }, { upsert: true });
  }

  public override onLoad() {
    // Only enable this listener if logger is in debug mode
    this.enabled = (this.container.logger as Logger).level <= LogLevel.Debug;
    return super.onLoad();
  }
}
