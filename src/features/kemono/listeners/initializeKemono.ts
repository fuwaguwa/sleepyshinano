import { ApplyOptions } from "@sapphire/decorators";
import { Events, Listener, type ListenerOptions } from "@sapphire/framework";
import { KEMONO } from "../lib/kemono";

@ApplyOptions<ListenerOptions>({
  once: true,
  event: Events.ClientReady,
})
export class ReadyListener extends Listener {
  public override async run() {
    await KEMONO.start();
  }
}
