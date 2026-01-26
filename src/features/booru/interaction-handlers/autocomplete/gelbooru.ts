import { ApplyOptions } from "@sapphire/decorators";
import { InteractionHandler, type InteractionHandlerOptions, InteractionHandlerTypes } from "@sapphire/framework";
import type { AutocompleteInteraction } from "discord.js";
import { fetch } from "netbun";
import { SHINANO_CONFIG } from "../../../../shared/constants";
import { BOORU_CONFIG } from "../../constants";
import type { GelbooruTagResponse } from "../../types/API";

@ApplyOptions<InteractionHandlerOptions>({
  interactionHandlerType: InteractionHandlerTypes.Autocomplete,
})
export class GelbooruAutocompleteHandler extends InteractionHandler {
  public override async run(interaction: AutocompleteInteraction, result: InteractionHandler.ParseResult<this>) {
    return interaction.respond(result);
  }

  public override async parse(interaction: AutocompleteInteraction) {
    const optionsData = interaction.options.data;
    const subcommandExists = optionsData.length !== 0 && optionsData[0].type === 1;

    let subcommandName = "";
    if (subcommandExists) subcommandName = interaction.options.getSubcommand();

    const commandName = interaction.commandName;
    if (commandName !== "gelbooru" && subcommandName !== "gelbooru") return this.none();

    const focusedOption = interaction.options.getFocused(true);
    if (focusedOption.name !== "tags") return this.none();

    const tags = focusedOption.value.split(" ").filter(tag => tag.trim());
    const lastTag = tags[tags.length - 1] || "";
    const previousTags = tags.slice(0, -1);
    const prefix = previousTags.length > 0 ? `${previousTags.join(" ")} ` : "";

    // Don't search if last tag is too short
    if (lastTag.length < 2)
      return this.some([{ name: focusedOption.value || "Type to search...", value: focusedOption.value }]);

    const params = new URLSearchParams({
      page: "dapi",
      s: "tag",
      q: "index",
      json: "1",
      name_pattern: `${lastTag}%`,
      api_key: BOORU_CONFIG.gelbooru.apiKey as string,
      user_id: BOORU_CONFIG.gelbooru.userId as string,
      limit: "10",
    });

    const url = `https://gelbooru.com/index.php?${params.toString()}`;

    try {
      const response = await fetch(url, { proxy: SHINANO_CONFIG.socksProxy });
      const data = (await response.json()) as GelbooruTagResponse;

      if (!data.tag?.length) return this.some([{ name: `No tags found for "${lastTag}"`, value: focusedOption.value }]);

      const suggestions = data.tag.slice(0, 10).map(tag => {
        const fullTag = `${prefix}${tag.name}`;
        return { name: fullTag, value: fullTag };
      });

      return this.some(suggestions);
    } catch (error) {
      // On error, return current input
      this.container.logger.error(`Gelbooru Autocomplete: ${(error as Error).message}`);
      return this.some([{ name: focusedOption.value || "Search error", value: focusedOption.value }]);
    }
  }
}
