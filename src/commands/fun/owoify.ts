import { ApplyOptions } from "@sapphire/decorators";
import { Command, type CommandOptions } from "@sapphire/framework";
import {
  type ChatInputCommandInteraction,
  ContainerBuilder,
  EmbedBuilder,
  MessageFlags,
  TextDisplayBuilder,
} from "discord.js";
import { standardCommandOptions } from "../../lib/utils/command";
import { fetchJson } from "../../lib/utils/http";

import type { OwoifyResponse } from "../../typings/api/misc";

const NEKOS_LIFE_API_URL = "https://nekos.life/api/v2/owoify?text=";

@ApplyOptions<CommandOptions>({
  description: "Owoify your text",
  ...standardCommandOptions,
})
export class OwoifyCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(builder =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption(option =>
          option.setName("text").setDescription("The text you want to owoify (Limit: 200 chars)").setRequired(true)
        )
    );
  }

  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    if (!interaction.deferred) await interaction.deferReply();

    const text = interaction.options.getString("text", true);

    if (text.length > 200) {
      const errorText = new TextDisplayBuilder().setContent(
        "❌ The `text` is constrained by a limit of 200 characters..."
      );
      const containerComponent = new ContainerBuilder().addTextDisplayComponents(errorText).setAccentColor([255, 0, 0]);
      return interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: [containerComponent] });
    }

    try {
      const data = await fetchJson<OwoifyResponse>(`${NEKOS_LIFE_API_URL}${encodeURIComponent(text)}`);

      if (!data || !data.owo) throw new Error("Failed to owoify");

      const owoEmbed = new EmbedBuilder().setColor("#2b2d31").setDescription(`> ${data.owo}\n\n- ${interaction.user}`);

      await interaction.editReply({ embeds: [owoEmbed] });
    } catch (error) {
      const errorText = new TextDisplayBuilder().setContent("❌️ Failed to owoify text");
      const containerComponent = new ContainerBuilder().addTextDisplayComponents(errorText).setAccentColor([255, 0, 0]);

      await interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: [containerComponent] });
      throw error;
    }
  }
}
