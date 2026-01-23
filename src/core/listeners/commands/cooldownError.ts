import { ApplyOptions } from "@sapphire/decorators";
import {
  type ChatInputCommandDeniedPayload,
  type Events,
  Identifiers,
  Listener,
  type ListenerOptions,
  type UserError,
} from "@sapphire/framework";
import { ContainerBuilder, MessageFlags, TextDisplayBuilder } from "discord.js";

@ApplyOptions<ListenerOptions>({
  event: "chatInputCommandDenied",
})
export class CooldownErrorCommandListener extends Listener<typeof Events.ChatInputCommandDenied> {
  public override async run({ context, identifier }: UserError, { interaction }: ChatInputCommandDeniedPayload) {
    if (Reflect.get(Object(context), "silent")) return;
    if (identifier !== Identifiers.PreconditionCooldown) return;

    const remaining = Reflect.get(Object(context), "remaining") as number;
    const retryTimestamp = Math.floor((Date.now() + remaining) / 1000);

    const errorText = new TextDisplayBuilder().setContent(
      `## You're on cooldown!\nYou will be able to run the command again <t:${retryTimestamp}:R>`
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
