import { ApplyOptions } from "@sapphire/decorators";
import { Command, type CommandOptions } from "@sapphire/framework";
import { EmbedBuilder } from "discord.js";
import { standardCommandOptions } from "../../lib/utils/command";
import { fetchJson } from "../../lib/utils/http";

import type { DadJokeResponse } from "../../typings/api/misc";

const DAD_JOKE_API = "https://icanhazdadjoke.com/";

@ApplyOptions<CommandOptions>({
  description: "Make a dadjoke",
  ...standardCommandOptions,
})
export class DadjokeCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(builder =>
      builder.setName(this.name).setDescription(this.description)
    );
  }

  public override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction
  ) {
    if (!interaction.deferred) await interaction.deferReply();

    try {
      const { joke } = await fetchJson<DadJokeResponse>(DAD_JOKE_API, {
        headers: { Accept: "application/json" },
      });

      const embed = new EmbedBuilder().setColor("Random").setDescription(joke);

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      const errorEmbed = new EmbedBuilder()
        .setColor("Red")
        .setDescription(
          "❌ | Failed to fetch a dad joke. Please try again later."
        );
      await interaction.editReply({ embeds: [errorEmbed] });
      throw error;
    }
  }
}
