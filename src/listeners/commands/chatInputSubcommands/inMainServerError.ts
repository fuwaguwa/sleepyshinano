import { ApplyOptions } from "@sapphire/decorators";
import { Listener, type ListenerOptions, type UserError } from "@sapphire/framework";
import type { ChatInputSubcommandDeniedPayload, SubcommandPluginEvents } from "@sapphire/plugin-subcommands";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";

@ApplyOptions<ListenerOptions>({
  event: "chatInputSubcommandDenied",
})
export class InMainServerErrorSubcommandListener extends Listener<
  typeof SubcommandPluginEvents.ChatInputSubcommandDenied
> {
  public override async run({ context, identifier }: UserError, { interaction }: ChatInputSubcommandDeniedPayload) {
    if (Reflect.get(Object(context), "silent")) return;
    if (identifier !== "inMainServerError") return;

    const exclusiveEmbed = new EmbedBuilder()
      .setColor("Red")
      .setTitle("Exclusive Command!")
      .setDescription(
        "You have used a command exclusive to the members of the Shrine of Shinano server, join the server to use the command anywhere!"
      );

    const button = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setLabel("Join Server!")
        .setEmoji({ name: "🔗" })
        .setURL("https://discord.gg/NFkMxFeEWr")
    );

    if (interaction.deferred || interaction.replied) {
      return interaction.editReply({
        embeds: [exclusiveEmbed],
        components: [button],
      });
    }

    return interaction.reply({
      embeds: [exclusiveEmbed],
      components: [button],
      ephemeral: true,
    });
  }
}
