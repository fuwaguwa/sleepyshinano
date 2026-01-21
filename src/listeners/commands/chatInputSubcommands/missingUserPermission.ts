import { ApplyOptions } from "@sapphire/decorators";
import { Identifiers, Listener, type ListenerOptions, type UserError } from "@sapphire/framework";
import type { ChatInputSubcommandDeniedPayload, SubcommandPluginEvents } from "@sapphire/plugin-subcommands";
import { ContainerBuilder, MessageFlags, TextDisplayBuilder } from "discord.js";

@ApplyOptions<ListenerOptions>({
  event: "chatInputSubcommandDenied",
})
export class MissingUserPermissionSubcommandListener extends Listener<
  typeof SubcommandPluginEvents.ChatInputSubcommandDenied
> {
  public override async run({ context, identifier }: UserError, { interaction }: ChatInputSubcommandDeniedPayload) {
    if (Reflect.get(Object(context), "silent")) return;
    if (identifier !== Identifiers.PreconditionUserPermissions) return;

    const missing = Reflect.get(Object(context), "missing") as string[];
    if (!missing || missing.length === 0) return;

    const errorText = new TextDisplayBuilder().setContent(
      `## Missing Permissions\n❌ You currently are missing the following permission(s): ${missing.join(", ")}`
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
