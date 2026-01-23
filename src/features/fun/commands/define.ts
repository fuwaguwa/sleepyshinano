import { ApplyOptions } from "@sapphire/decorators";
import { Command, type CommandOptions } from "@sapphire/framework";
import {
  ApplicationIntegrationType,
  type ChatInputCommandInteraction,
  ContainerBuilder,
  InteractionContextType,
  MediaGalleryBuilder,
  MessageFlags,
  TextDisplayBuilder,
} from "discord.js";
import { fetchJson } from "../../../shared/lib/http";
import type { UrbanDictionaryResponse } from "../types/API";

const URBAN_DICTIONARY_API_URL = "https://api.urbandictionary.com/v0/define?term=";

@ApplyOptions<CommandOptions>({
  description: "Get a word's definition from Urban Dictionary",
  preconditions: ["NotBlacklisted"],
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

  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    if (!interaction.deferred) await interaction.deferReply();

    const word = interaction.options.getString("word", true);

    try {
      const definition = await fetchJson<UrbanDictionaryResponse>(
        `${URBAN_DICTIONARY_API_URL}${encodeURIComponent(word)}`
      );

      if (!definition || !definition.list) throw new Error("Invalid response from Urban Dictionary API");

      if (definition.list.length === 0) {
        const errorText = new TextDisplayBuilder().setContent("❌️ No results found!");
        const containerComponent = new ContainerBuilder()
          .addTextDisplayComponents(errorText)
          .setAccentColor([255, 0, 0]);
        return interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: [containerComponent] });
      }

      const wordInfo = definition.list[0];
      const definitionText = new TextDisplayBuilder().setContent(
        `## "${wordInfo.word}"\n\n` +
          `${wordInfo.definition}\n\n` +
          `-# Definition by ${wordInfo.author} | ${wordInfo.thumbs_up} 👍 / ${wordInfo.thumbs_down} 👎`
      );

      const containerComponent = new ContainerBuilder().addTextDisplayComponents(definitionText);

      if (word.toLowerCase() === "shinano") {
        const shinanoImage = new MediaGalleryBuilder().addItems([
          {
            media: {
              url: "https://cdn.donmai.us/sample/c0/37/__shinano_azur_lane_drawn_by_waa_okami__sample-c037f94c2287a60578bef71acf163865.jpg",
            },
          },
        ]);
        containerComponent.addMediaGalleryComponents(shinanoImage);
      }

      await interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: [containerComponent] });
    } catch (error) {
      const errorText = new TextDisplayBuilder().setContent("❌️ Failed to fetch definition");
      const containerComponent = new ContainerBuilder().addTextDisplayComponents(errorText).setAccentColor([255, 0, 0]);

      await interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: [containerComponent] });
      throw error;
    }
  }
}
