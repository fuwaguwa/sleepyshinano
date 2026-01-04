import { ApplyOptions } from "@sapphire/decorators";
import {
  type ChatInputCommandDeniedPayload,
  Listener,
  type ListenerOptions,
  type UserError,
} from "@sapphire/framework";
import type { SubcommandPluginEvents } from "@sapphire/plugin-subcommands";
import { EmbedBuilder, MessageFlagsBitField } from "discord.js";
import { VOTE_LINK_BUTTON } from "../../../lib/constants";

@ApplyOptions<ListenerOptions>({
  event: "chatInputCommandDenied",
})
export class VotedError extends Listener<typeof SubcommandPluginEvents.ChatInputSubcommandDenied> {
  public override async run(
    { context, identifier, message }: UserError,
    { interaction }: ChatInputCommandDeniedPayload
  ) {
    if (Reflect.get(Object(context), "silent")) return;
    if (identifier !== "votedError") return;

    const errorEmbed = new EmbedBuilder().setColor("Red").setTimestamp();

    if (message === "noVote") {
      errorEmbed.setDescription(
        "It seems that you have not cast your vote for me! Please do so with the option below!"
      );
    } else {
      const voteTimestamp = message.split("-")[1];
      errorEmbed.setDescription(
        `Your last vote was <t:${voteTimestamp}:R>, you can now vote again using the button below!`
      );
    }

    if (interaction.deferred || interaction.replied) {
      return interaction.editReply({
        embeds: [errorEmbed],
        components: [VOTE_LINK_BUTTON],
        allowedMentions: { users: [interaction.user.id], roles: [] },
      });
    }

    return interaction.reply({
      embeds: [errorEmbed],
      components: [VOTE_LINK_BUTTON],
      allowedMentions: { users: [interaction.user.id], roles: [] },
      flags: MessageFlagsBitField.Flags.Ephemeral,
    });
  }
}
