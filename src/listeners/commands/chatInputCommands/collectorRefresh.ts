import { ApplyOptions } from "@sapphire/decorators";
import { type Events, Listener, type ListenerOptions } from "@sapphire/framework";
import type { ChatInputCommandInteraction } from "discord.js";
import { collectorsRefresh } from "../../../lib/collectors";

@ApplyOptions<ListenerOptions>({
  event: "chatInputCommandRun",
})
export class CollectorRefreshListener extends Listener<typeof Events.ChatInputCommandRun> {
  public override run(interaction: ChatInputCommandInteraction) {
    collectorsRefresh(interaction);
  }
}
