import type { ChatInputCommandInteraction, Interaction, InteractionCollector } from "discord.js";

export const buttonInteractionCollectorCache: Map<string, InteractionCollector<any>> = new Map();
export const paginatorInteractionCollectorCache: Map<string, InteractionCollector<any>> = new Map();

/**
 * Refresh/clean up user collectors when they run a new command
 */
export function refreshInteractionCollectors(interaction: ChatInputCommandInteraction | Interaction) {
  // Stop and remove existing button collectors for this user
  if (buttonInteractionCollectorCache.has(interaction.user.id)) {
    const collector = buttonInteractionCollectorCache.get(interaction.user.id);
    if (collector && !collector.ended) collector.stop();
    buttonInteractionCollectorCache.delete(interaction.user.id);
  }

  // Stop and remove existing pagination collectors for this user
  if (paginatorInteractionCollectorCache.has(interaction.user.id)) {
    const collector = paginatorInteractionCollectorCache.get(interaction.user.id);
    if (collector && !collector.ended) collector.stop();
    paginatorInteractionCollectorCache.delete(interaction.user.id);
  }
}
