import { ApplyOptions } from "@sapphire/decorators";
import {
  type ChatInputCommandDeniedPayload,
  Listener,
  type ListenerOptions,
  type UserError,
} from "@sapphire/framework";
import { ContainerBuilder, MessageFlags, TextDisplayBuilder } from "discord.js";

@ApplyOptions<ListenerOptions>({
  event: "chatInputCommandDenied",
})
export class BlacklistedErrorCommandListener extends Listener {
  public override async run({ context, identifier }: UserError, { interaction }: ChatInputCommandDeniedPayload) {
    if (Reflect.get(Object(context), "silent")) return;
    if (identifier !== "blacklisted") return;

    const errorText = new TextDisplayBuilder().setContent(
      "## You have been blacklisted!\nPlease contact us at the [support server](https://discord.gg/NFkMxFeEWr) for more information about your blacklist."
    );
    const errorContainer = new ContainerBuilder().addTextDisplayComponents(errorText).setAccentColor([255, 0, 0]);

    if (interaction.deferred || interaction.replied) {
      return interaction.editReply({
        components: [errorContainer],
        allowedMentions: { users: [interaction.user.id], roles: [] },
        flags: MessageFlags.IsComponentsV2,
      });
    }

    return interaction.reply({
      components: [errorContainer],
      allowedMentions: { users: [interaction.user.id], roles: [] },
      flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
    });
  }
}
