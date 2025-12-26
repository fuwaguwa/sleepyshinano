import { ApplyOptions } from "@sapphire/decorators";
import { Command, type CommandOptions } from "@sapphire/framework";
import { EmbedBuilder } from "discord.js";
import { standardCommandOptions } from "../../lib/utils/command";
import { fetchJson } from "../../lib/utils/http";

import type { OwoifyResponse } from "../../typings/api/misc";

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
          option
            .setName("text")
            .setDescription("The text you want to owoify (Limit: 200 chars)")
            .setRequired(true)
        )
    );
  }

  public override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction
  ) {
    if (!interaction.deferred) await interaction.deferReply();

    const text = interaction.options.getString("text", true);

    if (text.length > 200) {
      const invalidEmbed = new EmbedBuilder()
        .setColor("Red")
        .setDescription(
          "❌ | The `text` is constrained by a limit of 200 characters..."
        );
      return interaction.editReply({ embeds: [invalidEmbed] });
    }

    try {
      const data = await fetchJson<OwoifyResponse>(
        `https://nekos.life/api/v2/owoify?text=${encodeURIComponent(text)}`
      );

      const owoEmbed = new EmbedBuilder()
        .setColor("#2b2d31")
        .setDescription(`> ${data.owo}\n\n- ${interaction.user}`);

      await interaction.editReply({ embeds: [owoEmbed] });
    } catch (error) {
      this.container.logger.error("Failed to owoify text:", error);
      const errorEmbed = new EmbedBuilder()
        .setColor("Red")
        .setDescription("❌ | Failed to owoify text. Please try again later.");
      await interaction.editReply({ embeds: [errorEmbed] });
    }
  }
}
