import { ApplyOptions } from "@sapphire/decorators";
import { Events, Listener, type ListenerOptions } from "@sapphire/framework";
import { ActivityType } from "discord.js";
import { ShinanoAutobooru } from "../../features/booru/lib/autobooru";
import { KEMONO } from "../../features/kemono/lib/kemono";
import { ShinanoAutolewd } from "../../features/private-lewd/lib/autolewd";
import { updateServerCount } from "../logging";

@ApplyOptions<ListenerOptions>({
  once: true,
  event: Events.ClientReady,
})
export class ReadyListener extends Listener {
  public override async run() {
    this.container.logger.info("Shinano is ready!");

    await updateServerCount();

    this.container.client.user?.setActivity({
      name: "/shinano help",
      type: ActivityType.Custom,
    });

    const autobooru = new ShinanoAutobooru();
    const autolewd = new ShinanoAutolewd();

    await autobooru.startBooruPosting();
    await autolewd.startLewdPosting();
    await KEMONO.start();
  }
}
