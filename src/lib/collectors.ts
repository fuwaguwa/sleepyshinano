import {
  type ChatInputCommandInteraction,
  Collection,
  type Interaction,
  type InteractionCollector,
} from "discord.js";

export const buttonCollector: Collection<
  string,
  InteractionCollector<any>
> = new Collection();
export const paginationCollector: Collection<
  string,
  InteractionCollector<any>
> = new Collection();

/**
 * Refresh/clean up user collectors when they run a new command
 */
export function collectorsRefresh(
  interaction: ChatInputCommandInteraction | Interaction
) {
  // Stop and remove existing button collectors for this user
  if (buttonCollector.has(interaction.user.id)) {
    const collector = buttonCollector.get(interaction.user.id);
    if (collector && !collector.ended) collector.stop();
    buttonCollector.delete(interaction.user.id);
  }

  // Stop and remove existing pagination collectors for this user
  if (paginationCollector.has(interaction.user.id)) {
    const collector = paginationCollector.get(interaction.user.id);
    if (collector && !collector.ended) collector.stop();
    paginationCollector.delete(interaction.user.id);
  }
}
