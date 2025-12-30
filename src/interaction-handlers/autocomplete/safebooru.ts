import { ApplyOptions } from "@sapphire/decorators";
import { InteractionHandler, type InteractionHandlerOptions, InteractionHandlerTypes } from "@sapphire/framework";
import type { AutocompleteInteraction } from "discord.js";
import { fetch } from "netbun";

@ApplyOptions<InteractionHandlerOptions>({
  interactionHandlerType: InteractionHandlerTypes.Autocomplete,
})
export class SafebooruAutocompleteHandler extends InteractionHandler {
  public override async run(interaction: AutocompleteInteraction, result: InteractionHandler.ParseResult<this>) {
    return interaction.respond(result);
  }

  public override async parse(interaction: AutocompleteInteraction) {
    if (interaction.commandName !== "safebooru") return this.none();

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
      limit: "10",
    });

    const url = `https://safebooru.org/index.php?${params.toString()}`;

    try {
      const response = await fetch(url);
      const xmlText = await response.text();

      // Parse XML to extract tag names
      const tagMatches = xmlText.matchAll(/<tag[^>]+name="([^"]+)"/g);
      const tagNames = Array.from(tagMatches, match => match[1]);

      if (!tagNames.length) return this.some([{ name: `No tags found for "${lastTag}"`, value: focusedOption.value }]);

      const suggestions = tagNames.slice(0, 10).map(tagName => {
        const fullTag = `${prefix}${tagName}`;
        return { name: fullTag, value: fullTag };
      });

      return this.some(suggestions);
    } catch {
      // On error, return current input
      return this.some([{ name: focusedOption.value || "Search error", value: focusedOption.value }]);
    }
  }
}
