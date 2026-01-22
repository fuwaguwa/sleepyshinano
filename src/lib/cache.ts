import {
  type ButtonInteraction,
  type ChatInputCommandInteraction,
  EmbedBuilder,
  type Interaction,
  type InteractionCollector,
  MessageFlags,
} from "discord.js";
import type { KemonoPost } from "../structures/Kemono";
import type { PostListItem } from "../typings/kemono";

export const buttonInteractionCollectorCache: Map<string, InteractionCollector<any>> = new Map();
export const buttonCooldownCache: Map<string, number> = new Map();
export const paginatorInteractionCollectorCache: Map<string, InteractionCollector<any>> = new Map();
export const kemonoPostsCache: Map<string, PostListItem[]> = new Map();
export const kemonoPostContentCache: Map<string, KemonoPost> = new Map();
const BUTTON_COOLDOWN_MS = 5000;

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

/**
 * Check the cooldown of an user (on buttons)
 */
export async function checkButtonCooldownCache(id: string, interaction: ButtonInteraction): Promise<boolean> {
  const userId = interaction.user.id;
  if (buttonCooldownCache.has(`${id}${userId}`)) {
    // 100% sure
    const cms = buttonCooldownCache.get(`${id}${userId}`) as number;
    const embed = new EmbedBuilder()
      .setTitle("You're on cooldown!")
      .setDescription(`You will be able to use the button again <t:${Math.floor(cms / 1000)}:R>`)
      .setColor("Red");
    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    return true;
  }
  return false;
}

/**
 * Set the cooldown for buttons
 */
export function setButtonCooldownCache(id: string, interaction: ButtonInteraction) {
  const userId = interaction.user.id;
  if (process.env.OWNER_IDS.split(",").includes(userId)) return; // No cooldown for bot owners

  buttonCooldownCache.set(`${id}${userId}`, Date.now() + BUTTON_COOLDOWN_MS);
  setTimeout(() => {
    buttonCooldownCache.delete(`${id}${userId}`);
  }, BUTTON_COOLDOWN_MS);
}

export function setKemonoPostsCache(creatorId: string, posts: PostListItem[]) {
  kemonoPostsCache.set(creatorId, posts);

  setTimeout(
    () => {
      kemonoPostsCache.delete(creatorId);
    },
    10 * 60 * 1000
  );
}

export function setKemonoPostContentCache(postId: string, creatorId: string, post: KemonoPost) {
  const cacheKey = `${creatorId}-${postId}`;

  kemonoPostContentCache.set(cacheKey, post);
  setTimeout(
    () => {
      kemonoPostContentCache.delete(cacheKey);
    },
    12 * 60 * 60 * 1000
  );
}
