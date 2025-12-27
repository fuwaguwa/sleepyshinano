import { ApplyOptions } from "@sapphire/decorators";
import {
  type ChatInputCommandDeniedPayload,
  type Events,
  Listener,
  type ListenerOptions,
  type UserError,
} from "@sapphire/framework";
import { EmbedBuilder, MessageFlagsBitField } from "discord.js";
import { VOTE_LINK_BUTTON } from "../../../lib/constants";

@ApplyOptions<ListenerOptions>({
  event: "chatInputCommandDenied",
})
export class VotedError extends Listener<typeof Events.ChatInputCommandDenied> {
  public override async run(
    { context, identifier, message: content }: UserError,
    { interaction }: ChatInputCommandDeniedPayload
  ) {
    if (Reflect.get(Object(context), "silent")) return;
    if (identifier !== "votedError") return;

    const errorEmbed = new EmbedBuilder().setColor("Red").setTimestamp();

    if (content === "noVote") {
      errorEmbed.setDescription(
        "It seems that you have not cast your vote for me! Please do so with the option below!"
      );
    } else {
      const voteTimestamp = content.split("-")[1];
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
