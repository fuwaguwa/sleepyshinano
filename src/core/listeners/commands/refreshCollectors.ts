import { ApplyOptions } from "@sapphire/decorators";
import { type Events, Listener, type ListenerOptions } from "@sapphire/framework";
import type { ChatInputCommandInteraction } from "discord.js";
import { refreshInteractionCollectors } from "../../../shared/lib/collectors";

@ApplyOptions<ListenerOptions>({
  event: "chatInputCommandRun",
})
export class CollectorRefreshCommandListener extends Listener<typeof Events.ChatInputCommandRun> {
  public override run(interaction: ChatInputCommandInteraction) {
    refreshInteractionCollectors(interaction);
  }
}
