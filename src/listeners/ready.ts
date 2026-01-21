import { ApplyOptions } from "@sapphire/decorators";
import { Events, Listener, type ListenerOptions } from "@sapphire/framework";
import { ActivityType } from "discord.js";
import { KEMONO } from "../lib/constants";
import { startCatchers } from "../lib/utils/db";
import { updateServerCount } from "../lib/utils/logging";
import { ShinanoAutobooru } from "../structures/Autobooru";
import { ShinanoAutolewd } from "../structures/Autolewd";

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

    startCatchers(this.container.client);

    const lewd = new ShinanoAutolewd();
    const booru = new ShinanoAutobooru();

    await lewd.startLewdPosting();
    await booru.startBooruPosting();
    await KEMONO.start();
  }
}
