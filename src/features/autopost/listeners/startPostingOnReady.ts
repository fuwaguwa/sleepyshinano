import { ApplyOptions } from "@sapphire/decorators";
import { Events, Listener, type ListenerOptions } from "@sapphire/framework";
import { ShinanoAutobooru } from "../lib/autobooru";
import { ShinanoAutolewd } from "../lib/autolewd";

@ApplyOptions<ListenerOptions>({
  once: true,
  event: Events.ClientReady,
})
export class ReadyListener extends Listener {
  public override async run() {
    const autobooru = new ShinanoAutobooru();
    const autolewd = new ShinanoAutolewd();

    await autobooru.startBooruPosting();
    await autolewd.startLewdPosting();
  }
}
