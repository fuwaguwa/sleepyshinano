import { ApplyOptions } from "@sapphire/decorators";
import {
  type ChatInputCommandDeniedPayload,
  Listener,
  type ListenerOptions,
  type UserError,
} from "@sapphire/framework";
import { EmbedBuilder } from "discord.js";

@ApplyOptions<ListenerOptions>({
  event: "chatInputCommandDenied",
})
export class BlacklistedErrorListener extends Listener {
  public override async run({ context, identifier }: UserError, { interaction }: ChatInputCommandDeniedPayload) {
    if (Reflect.get(Object(context), "silent")) return;
    if (identifier !== "blacklisted") return;

    const errorEmbed = new EmbedBuilder()
      .setColor("Red")
      .setTitle("You have been blacklisted!")
      .setDescription(
        "Please contact us at the [support server](https://discord.gg/NFkMxFeEWr) for more information about your blacklist."
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
      ephemeral: true,
    });
  }
}
