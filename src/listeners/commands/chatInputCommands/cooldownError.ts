import { ApplyOptions } from "@sapphire/decorators";
import {
  type ChatInputCommandDeniedPayload,
  type Events,
  Identifiers,
  Listener,
  type ListenerOptions,
  type UserError,
} from "@sapphire/framework";
import { MessageFlagsBitField } from "discord.js";

@ApplyOptions<ListenerOptions>({
  event: "chatInputCommandDenied",
})
export class CooldownErrorListener extends Listener<
  typeof Events.ChatInputCommandDenied
> {
  public override async run(
    { context, identifier }: UserError,
    { interaction }: ChatInputCommandDeniedPayload
  ) {
    if (Reflect.get(Object(context), "silent")) return;
    if (identifier !== Identifiers.PreconditionCooldown) return;

    const remaining = Reflect.get(Object(context), "remaining") as number;
    const retryTimestamp = Math.floor((Date.now() + remaining) / 1000);

    const errorEmbed = {
      title: "You're on cooldown!",
      description: `You will be able to run the command again <t:${retryTimestamp}:R>`,
      color: 0xff0000, // Red color
    };

    if (interaction.deferred || interaction.replied) {
      return interaction.editReply({
        embeds: [errorEmbed],
        allowedMentions: { users: [interaction.user.id], roles: [] },
      });
    }

    return interaction.reply({
      embeds: [errorEmbed],
      allowedMentions: { users: [interaction.user.id], roles: [] },
      flags: MessageFlagsBitField.Flags.Ephemeral,
    });
  }
}
