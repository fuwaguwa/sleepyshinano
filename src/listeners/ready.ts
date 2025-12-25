import { ApplyOptions } from "@sapphire/decorators";
import { Events, Listener, type ListenerOptions } from "@sapphire/framework";
import { ActivityType } from "discord.js";
import { ShinanoAutoLewd } from "../lib/auto";
import { startCatchers, updateServerCount } from "../lib/utils";

@ApplyOptions<ListenerOptions>({
  once: true,
  event: Events.ClientReady,
})
export class ReadyListener extends Listener {
  public constructor(context: Listener.LoaderContext, options: ListenerOptions) {
    super(context, options);
    this.container.logger.info("ReadyListener listener loaded.");
  }

  public override async run() {
    this.container.logger.info("Shinano is ready!");

    await updateServerCount();

    this.container.client.user?.setActivity({
      name: "/shinano help",
      type: ActivityType.Custom,
    });

    startCatchers(this.container.client);

    const lewd = new ShinanoAutoLewd();
    await lewd.startLewdPosting();
  }
}
