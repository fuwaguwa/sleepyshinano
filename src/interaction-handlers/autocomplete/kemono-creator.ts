import { ApplyOptions } from "@sapphire/decorators";
import { InteractionHandler, type InteractionHandlerOptions, InteractionHandlerTypes } from "@sapphire/framework";
import type { AutocompleteInteraction } from "discord.js";
import { KEMONO } from "../../lib/constants";
import { toTitleCase } from "../../lib/utils/misc";

@ApplyOptions<InteractionHandlerOptions>({
  interactionHandlerType: InteractionHandlerTypes.Autocomplete,
})
export class KemonoCreatorAutocompleteHandler extends InteractionHandler {
  public override async run(interaction: AutocompleteInteraction, result: InteractionHandler.ParseResult<this>) {
    return interaction.respond(result);
  }

  public override async parse(interaction: AutocompleteInteraction) {
    const optionsData = interaction.options.data;
    const subcommandExists = optionsData.length !== 0 && optionsData[0].type === 1;

    let subcommandName = "";
    if (subcommandExists) subcommandName = interaction.options.getSubcommand();

    const commandName = interaction.commandName;
    if (commandName !== "kemono" && subcommandName !== "creator") return this.none();

    const focusedOption = interaction.options.getFocused(true);
    if (focusedOption.name !== "name") return this.none();
    const searchTerm = focusedOption.value;

    if (searchTerm.length === 0) return this.some([{ name: "Type to search...", value: focusedOption.value }]);
    else if (searchTerm.length < 2)
      return this.some([{ name: "Continue typing to search...", value: focusedOption.value }]);

    const searchResults = await KEMONO.searchAPICreator(searchTerm, 9);

    if (!searchResults)
      return this.some([{ name: "Search error - The command will not work!", value: focusedOption.value }]);
    if (searchResults.length === 0)
      return this.some([{ name: `Creator not found - The command will not work!`, value: focusedOption.value }]);

    const results = searchResults.slice(0, 9).map(creator => {
      return {
        name: `${creator.name} | ${toTitleCase(creator.service)} | ${creator.favorited} ⭐️`,
        value: `id-${creator.id}`,
      };
    });

    results.push({ name: "CHOOSE THIS TO SEE FULL LIST!", value: `name-${focusedOption.value}` });

    return this.some(results);
  }
}
