import { ApplyOptions } from "@sapphire/decorators";
import {
  type ChatInputCommandDeniedPayload,
  type Events,
  Identifiers,
  Listener,
  type ListenerOptions,
  type UserError,
} from "@sapphire/framework";
import { EmbedBuilder, MessageFlagsBitField } from "discord.js";

@ApplyOptions<ListenerOptions>({
  event: "chatInputCommandDenied",
})
export class CooldownErrorListener extends Listener<typeof Events.ChatInputCommandDenied> {
  public override async run({ context, identifier }: UserError, { interaction }: ChatInputCommandDeniedPayload) {
    if (Reflect.get(Object(context), "silent")) return;
    if (identifier !== Identifiers.PreconditionCooldown) return;

    const remaining = Reflect.get(Object(context), "remaining") as number;
    const retryTimestamp = Math.floor((Date.now() + remaining) / 1000);

    const ERROR_EMBED = new EmbedBuilder()
      .setColor("Red")
      .setTitle("You're on cooldown!")
      .setDescription(`You will be able to run the command again <t:${retryTimestamp}:R>`);

    if (interaction.deferred || interaction.replied) {
      return interaction.editReply({
        embeds: [ERROR_EMBED],
        allowedMentions: { users: [interaction.user.id], roles: [] },
      });
    }

    return interaction.reply({
      embeds: [ERROR_EMBED],
      allowedMentions: { users: [interaction.user.id], roles: [] },
      flags: MessageFlagsBitField.Flags.Ephemeral,
    });
  }
}
