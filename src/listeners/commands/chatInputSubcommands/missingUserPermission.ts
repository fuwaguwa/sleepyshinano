import { ApplyOptions } from "@sapphire/decorators";
import {
  Identifiers,
  Listener,
  type ListenerOptions,
  type UserError,
} from "@sapphire/framework";
import type {
  ChatInputSubcommandDeniedPayload,
  SubcommandPluginEvents,
} from "@sapphire/plugin-subcommands";
import { EmbedBuilder, MessageFlagsBitField } from "discord.js";

@ApplyOptions<ListenerOptions>({
  event: "chatInputSubcommandDenied",
})
export class MissingUserPermissionSubcommandListener extends Listener<
  typeof SubcommandPluginEvents.ChatInputSubcommandDenied
> {
  public override async run(
    { context, identifier }: UserError,
    { interaction }: ChatInputSubcommandDeniedPayload
  ) {
    if (Reflect.get(Object(context), "silent")) return;
    if (identifier !== Identifiers.PreconditionUserPermissions) return;

    const missing = Reflect.get(Object(context), "missing") as string[];
    if (!missing || missing.length === 0) return;

    const errorEmbed = new EmbedBuilder()
      .setColor("Red")
      .setDescription(
        `❌ | You currently are missing the following permission(s): ${missing.join(", ")}`
      );

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
