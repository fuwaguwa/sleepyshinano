import { ApplyOptions } from "@sapphire/decorators";
import { Listener, type ListenerOptions, type UserError } from "@sapphire/framework";
import type { ChatInputSubcommandDeniedPayload, SubcommandPluginEvents } from "@sapphire/plugin-subcommands";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MessageFlags,
  SeparatorBuilder,
  TextDisplayBuilder,
} from "discord.js";

@ApplyOptions<ListenerOptions>({
  event: "chatInputSubcommandDenied",
})
export class InMainServerErrorSubcommandListener extends Listener<
  typeof SubcommandPluginEvents.ChatInputSubcommandDenied
> {
  public override async run({ context, identifier }: UserError, { interaction }: ChatInputSubcommandDeniedPayload) {
    if (Reflect.get(Object(context), "silent")) return;
    if (identifier !== "inMainServerError") return;

    const exclusiveText = new TextDisplayBuilder().setContent(
      "## Exclusive Command!\nYou have used a command exclusive to the members of the Shrine of Shinano server, join the server to use the command anywhere!"
    );
    const joinButton = new ActionRowBuilder<ButtonBuilder>().setComponents(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setLabel("Join Server!")
        .setEmoji({ name: "🔗" })
        .setURL("https://discord.gg/NFkMxFeEWr")
    );
    const exclusiveContainer = new ContainerBuilder()
      .addTextDisplayComponents(exclusiveText)
      .addSeparatorComponents(new SeparatorBuilder())
      .addActionRowComponents(joinButton)
      .setAccentColor([255, 0, 0]);

    if (interaction.deferred || interaction.replied) {
      return interaction.editReply({
        components: [exclusiveContainer],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    return interaction.reply({
      components: [exclusiveContainer],
      flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
    });
  }
}
