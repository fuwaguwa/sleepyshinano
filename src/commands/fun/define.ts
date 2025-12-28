import { ApplyOptions } from "@sapphire/decorators";
import { Command, type CommandOptions } from "@sapphire/framework";
import { ApplicationIntegrationType, EmbedBuilder, InteractionContextType } from "discord.js";
import { standardCommandOptions } from "../../lib/utils/command";
import { fetchJson } from "../../lib/utils/http";

import type { UrbanDictionaryResponse } from "../../typings/api/misc";

@ApplyOptions<CommandOptions>({
  description: "Get a word's definition from Urban Dictionary",
  ...standardCommandOptions,
})
export class DefineCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(builder =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .setIntegrationTypes([ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall])
        .setContexts([
          InteractionContextType.Guild,
          InteractionContextType.BotDM,
          InteractionContextType.PrivateChannel,
        ])
        .addStringOption(option =>
          option.setName("word").setDescription("The word you want to define").setRequired(true)
        )
    );
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    if (!interaction.deferred) await interaction.deferReply();

    const word = interaction.options.getString("word", true);

    try {
      const definition = await fetchJson<UrbanDictionaryResponse>(
        `https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(word)}`
      );

      if (definition.list.length === 0) {
        const noResult = new EmbedBuilder()
          .setColor("Red")
          .setDescription(`❌ | I apologize, but no definition for \`${word}\` can be located...`);
        return interaction.editReply({ embeds: [noResult] });
      }

      const wordInfo = definition.list[0];
      const definitionEmbed = new EmbedBuilder()
        .setColor("#2b2d31")
        .setTitle(`"${wordInfo.word}"`)
        .setDescription(wordInfo.definition)
        .setFooter({
          text: `Definition by ${wordInfo.author} | ${wordInfo.thumbs_up} 👍 / ${wordInfo.thumbs_down} 👎`,
        });

      if (word.toLowerCase() === "shinano") {
        definitionEmbed.setImage(
          "https://cdn.donmai.us/sample/c0/37/__shinano_azur_lane_drawn_by_waa_okami__sample-c037f94c2287a60578bef71acf163865.jpg"
        );
      }

      await interaction.editReply({ embeds: [definitionEmbed] });
    } catch (error) {
      const errorEmbed = new EmbedBuilder()
        .setColor("Red")
        .setDescription("❌ | Failed to fetch definition. Please try again later.");
      await interaction.editReply({ embeds: [errorEmbed] });
      throw error;
    }
  }
}
