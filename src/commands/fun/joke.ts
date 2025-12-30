import { ApplyOptions } from "@sapphire/decorators";
import { Command, type CommandOptions } from "@sapphire/framework";
import { EmbedBuilder } from "discord.js";
import { standardCommandOptions } from "../../lib/utils/command";
import { buildSraUrl, fetchJson } from "../../lib/utils/http";

import type { JokeResponse } from "../../typings/api/misc";

@ApplyOptions<CommandOptions>({
  description: "Tell you a joke, may or may not be funny",
  ...standardCommandOptions,
})
export class JokeCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(builder => builder.setName(this.name).setDescription(this.description));
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    if (!interaction.deferred) await interaction.deferReply();

    try {
      const data = await fetchJson<JokeResponse>(buildSraUrl("others/joke"));

      if (!data) throw new Error("Cannot find joke.");

      const jokeEmbed = new EmbedBuilder().setColor("#2b2d31").setDescription(data.joke);

      await interaction.editReply({ embeds: [jokeEmbed] });
    } catch (error) {
      const errorEmbed = new EmbedBuilder()
        .setColor("Red")
        .setDescription("❌ | Failed to fetch a joke. Please try again later.");
      await interaction.editReply({ embeds: [errorEmbed] });
      throw error;
    }
  }
}
