import { type ButtonInteraction, EmbedBuilder, MessageFlags } from "discord.js";
import { IMMUNE_IDS } from "../constants";

export const buttonCooldownCache: Map<string, number> = new Map();
const BUTTON_COOLDOWN_MS = 5000;

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
  if (IMMUNE_IDS.includes(userId)) return;

  buttonCooldownCache.set(`${id}${userId}`, Date.now() + BUTTON_COOLDOWN_MS);
  setTimeout(() => {
    buttonCooldownCache.delete(`${id}${userId}`);
  }, BUTTON_COOLDOWN_MS);
}
