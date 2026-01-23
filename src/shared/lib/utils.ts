import type { User } from "discord.js";

/**
 * Pick a random item from an array
 */
export function randomItem<T>(array: readonly T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Unix timestamp in seconds
 */
export function getCurrentTimestamp() {
  return Math.floor(Date.now() / 1000);
}

/**
 * Create text footer for components v2
 */
export function createTextFooter(user: User) {
  return `-# Requested by ${user.username} | <t:${getCurrentTimestamp()}:R>`;
}
