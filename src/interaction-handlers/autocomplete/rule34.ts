import { ApplyOptions } from "@sapphire/decorators";
import { InteractionHandler, type InteractionHandlerOptions, InteractionHandlerTypes } from "@sapphire/framework";
import type { AutocompleteInteraction } from "discord.js";
import { fetch } from "netbun";
import type { Rule34TagResponse } from "../../typings/api/booru";

@ApplyOptions<InteractionHandlerOptions>({
  interactionHandlerType: InteractionHandlerTypes.Autocomplete,
})
export class Rule34AutocompleteHandler extends InteractionHandler {
  public override async run(interaction: AutocompleteInteraction, result: InteractionHandler.ParseResult<this>) {
    return interaction.respond(result);
  }

  public override async parse(interaction: AutocompleteInteraction) {
    if (interaction.commandName !== "rule34") return this.none();

    const focusedOption = interaction.options.getFocused(true);
    if (focusedOption.name !== "tags") return this.none();

    const tags = focusedOption.value.split(" ").filter(tag => tag.trim());
    const lastTag = tags[tags.length - 1] || "";
    const previousTags = tags.slice(0, -1);
    const prefix = previousTags.length > 0 ? `${previousTags.join(" ")} ` : "";

    // Don't search if last tag is too short
    if (lastTag.length < 2)
      return this.some([{ name: focusedOption.value || "Type to search...", value: focusedOption.value }]);

    const url = `https://api.rule34.xxx/autocomplete.php?q=${encodeURIComponent(lastTag)}`;

    try {
      const response = await fetch(url, { proxy: process.env.SOCKS_PROXY });
      const data = (await response.json()) as Rule34TagResponse[];

      if (!data?.length) {
        return this.some([{ name: `No tags found for "${lastTag}"`, value: focusedOption.value }]);
      }

      const suggestions = data.slice(0, 10).map(tag => {
        const fullTag = `${prefix}${tag.value}`;
        return { name: fullTag, value: fullTag };
      });

      return this.some(suggestions);
    } catch {
      // On error, return current input
      return this.some([{ name: focusedOption.value || "Search error", value: focusedOption.value }]);
    }
  }
}
