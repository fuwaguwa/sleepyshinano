import { ApplyOptions } from "@sapphire/decorators";
import {
  type ChatInputCommandDeniedPayload,
  type Events,
  Listener,
  type ListenerOptions,
  type UserError,
} from "@sapphire/framework";
import { ContainerBuilder, MessageFlags, SeparatorBuilder, TextDisplayBuilder } from "discord.js";
import { VOTE_LINK_BUTTON } from "../../../lib/constants";

@ApplyOptions<ListenerOptions>({
  event: "chatInputCommandDenied",
})
export class VotedError extends Listener<typeof Events.ChatInputCommandDenied> {
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
      const voteCreatedTimestamp = message.split("-")[1];
      description = `Your last vote was <t:${voteCreatedTimestamp}:R>, you can now vote again using the button below!`;
    }

    const errorText = new TextDisplayBuilder().setContent(`## Vote Required\n${description}`);
    const errorButton = VOTE_LINK_BUTTON;
    const errorContainer = new ContainerBuilder()
      .addTextDisplayComponents(errorText)
      .addSeparatorComponents(new SeparatorBuilder())
      .addActionRowComponents(errorButton)
      .setAccentColor([255, 0, 0]);

    if (interaction.deferred || interaction.replied) {
      return interaction.editReply({
        components: [errorContainer],
        allowedMentions: { users: [interaction.user.id] },
        flags: MessageFlags.IsComponentsV2,
      });
    }

    return interaction.reply({
      components: [errorContainer],
      allowedMentions: { users: [interaction.user.id] },
      flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
    });
  }
}
