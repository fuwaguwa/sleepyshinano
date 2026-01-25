import { ApplyOptions } from "@sapphire/decorators";
import {
  type ChatInputCommandDeniedPayload,
  Listener,
  type ListenerOptions,
  type UserError,
} from "@sapphire/framework";
import { ContainerBuilder, MessageFlags, SeparatorBuilder, TextDisplayBuilder } from "discord.js";

@ApplyOptions<ListenerOptions>({
  event: "chatInputCommandDenied",
})
export class NSFWErrorCommandListener extends Listener {
  public override async run({ context, identifier }: UserError, { interaction }: ChatInputCommandDeniedPayload) {
    if (Reflect.get(Object(context), "silent")) return;
    if (identifier !== "preconditionNsfw") return;

    const nsfwTitle = new TextDisplayBuilder().setContent("### 🔞 NSFW Command");
    const nsfwContent = new TextDisplayBuilder().setContent("Please run this command in an NSFW channel to continue!");
    const separator = new SeparatorBuilder();

    const nsfwContainer = new ContainerBuilder()
      .addTextDisplayComponents(nsfwTitle)
      .addSeparatorComponents(separator)
      .addTextDisplayComponents(nsfwContent);

    // Reply because preconditions always runs first
    await interaction.reply({
      flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
      components: [nsfwContainer],
    });
  }
}
