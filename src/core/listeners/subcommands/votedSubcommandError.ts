import { ApplyOptions } from "@sapphire/decorators";
import {
  type ChatInputCommandDeniedPayload,
  Listener,
  type ListenerOptions,
  type UserError,
} from "@sapphire/framework";
import type { SubcommandPluginEvents } from "@sapphire/plugin-subcommands";
import { ContainerBuilder, MessageFlags, SeparatorBuilder, TextDisplayBuilder } from "discord.js";
import { VOTE_LINK_BUTTON } from "../../../shared/constants";

@ApplyOptions<ListenerOptions>({
  event: "chatInputCommandDenied",
})
export class VotedSubcommandError extends Listener<typeof SubcommandPluginEvents.ChatInputSubcommandDenied> {
  public override async run(
    { context, identifier, message }: UserError,
    { interaction }: ChatInputCommandDeniedPayload
  ) {
    if (Reflect.get(Object(context), "silent")) return;
    if (identifier !== "votedError") return;

    let description = "";
    if (message === "noVote") {
      description = "It seems that you have not cast your vote for me! Please do so with the option below!";
    } else {
      const voteTimestamp = message.split("-")[1];
      description = `Your last vote was <t:${voteTimestamp}:R>, you can now vote again using the button below!`;
    }

    const errorText = new TextDisplayBuilder().setContent(`## Vote Required\n${description}`);
    const errorButton = VOTE_LINK_BUTTON;
    const separator = new SeparatorBuilder();
    const errorContainer = new ContainerBuilder()
      .addTextDisplayComponents(errorText)
      .addSeparatorComponents(separator)
      .addActionRowComponents(errorButton)
      .setAccentColor([255, 0, 0]);

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
