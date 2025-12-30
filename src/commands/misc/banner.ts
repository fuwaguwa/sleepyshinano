import { ApplyOptions } from "@sapphire/decorators";
import { Command, type CommandOptions } from "@sapphire/framework";
import { ApplicationIntegrationType, EmbedBuilder, InteractionContextType } from "discord.js";
import { fetchJson } from "../../lib/utils/http";

import type { DiscordUserResponse } from "../../typings/api/misc";

@ApplyOptions<CommandOptions>({
  description: "Get a user's banner",
  preconditions: ["NotBlacklisted"],
  cooldownLimit: 1,
  cooldownDelay: 3000,
  cooldownFilteredUsers: process.env.COOL_PEOPLE_IDS?.split(",") || [],
})
export class BannerCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(builder =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .setIntegrationTypes([ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall])
        .setContexts([
          InteractionContextType.Guild,
          InteractionContextType.BotDM,
          InteractionContextType.PrivateChannel,
        ])
        .addUserOption(option => option.setName("user").setDescription("The user to get the banner from"))
    );
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const user = interaction.options.getUser("user") || interaction.user;

    if (!interaction.deferred) await interaction.deferReply();

    try {
      const data = await fetchJson<DiscordUserResponse>(`https://discord.com/api/v10/users/${user.id}`, {
        headers: { Authorization: `Bot ${process.env.BOT_TOKEN}` },
      });

      if (!data) throw new Error("Failed to fetch data from Discord API.");

      if (!data.banner) {
        const embed = new EmbedBuilder().setColor("Red").setDescription("❌ | User does not have a banner.");
        return interaction.editReply({ embeds: [embed] });
      }

      const baseUrl = `https://cdn.discordapp.com/banners/${user.id}/${data.banner}`;
      const isAnimated = data.banner?.startsWith("a_");
      const description = isAnimated
        ? `[.gif](${baseUrl}.gif?size=1024) | [.webp](${baseUrl}.webp?size=1024)`
        : `[.jpg](${baseUrl}.jpg?size=1024) | [.png](${baseUrl}.png?size=1024) | [.webp](${baseUrl}.webp?size=1024)`;
      const displayUrl = isAnimated ? `${baseUrl}.gif?size=1024` : `${baseUrl}.png?size=1024`;

      const embed = new EmbedBuilder()
        .setTitle(`${user.username}'s Banner`)
        .setColor("#2b2d31")
        .setDescription(description)
        .setImage(displayUrl);

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      const errorEmbed = new EmbedBuilder()
        .setColor("Red")
        .setDescription("❌ | Failed to fetch the banner. Please try again later.");
      await interaction.editReply({ embeds: [errorEmbed] });
      throw error;
    }
  }
}
