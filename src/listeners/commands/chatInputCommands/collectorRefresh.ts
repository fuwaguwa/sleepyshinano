import { type Events, Listener } from "@sapphire/framework";
import type { ChatInputCommandInteraction } from "discord.js";
import { collectorsRefresh } from "../../../lib/utils";

export class CollectorRefreshListener extends Listener<typeof Events.ChatInputCommandRun> {
  public override run(interaction: ChatInputCommandInteraction) {
    collectorsRefresh(interaction);
  }
}
