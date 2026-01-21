import {
  type ButtonInteraction,
  type ChatInputCommandInteraction,
  Collection,
  EmbedBuilder,
  type Interaction,
  type InteractionCollector,
  MessageFlags,
} from "discord.js";

export const buttonCollector: Collection<string, InteractionCollector<any>> = new Collection();
export const paginationCollector: Collection<string, InteractionCollector<any>> = new Collection();
export const buttonCooldown: Collection<string, number> = new Collection();
const BUTTON_COOLDOWN_MS = 5000;

/**
 * Refresh/clean up user collectors when they run a new command
 */
export function collectorsRefresh(interaction: ChatInputCommandInteraction | Interaction) {
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

/**
 * Check the cooldown of an user (on buttons)
 */
export async function buttonCooldownCheck(id: string, interaction: ButtonInteraction): Promise<boolean> {
  const userId = interaction.user.id;
  if (buttonCooldown.has(`${id}${userId}`)) {
    // 100% sure
    const cms = buttonCooldown.get(`${id}${userId}`) as number;
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
export function buttonCooldownSet(id: string, interaction: ButtonInteraction) {
  const userId = interaction.user.id;
  if (process.env.OWNER_IDS.split(",").includes(userId)) return; // No cooldown for bot owners

  buttonCooldown.set(`${id}${userId}`, Date.now() + BUTTON_COOLDOWN_MS);
  setTimeout(() => {
    buttonCooldown.delete(`${id}${userId}`);
  }, BUTTON_COOLDOWN_MS);
}
