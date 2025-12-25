import { ApplyOptions } from "@sapphire/decorators";
import {
  Command,
  type CommandOptions,
  CommandOptionsRunTypeEnum,
} from "@sapphire/framework";
import { EmbedBuilder } from "discord.js";
import { fetchJson } from "../../lib/utils";

interface DiscordUserResponse {
  banner?: string;
}

@ApplyOptions<CommandOptions>({
  description: "Get a user's banner",
  preconditions: ["NotBlacklisted"],
  cooldownLimit: 1,
  cooldownDelay: 3000,
  cooldownFilteredUsers: process.env.COOL_PEOPLE_IDS?.split(",") || [],
  runIn: CommandOptionsRunTypeEnum.GuildAny,
})
export class BannerCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(builder =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addUserOption(option =>
          option
            .setName("user")
            .setDescription("The user to get the banner from")
        )
    );
  }

  public override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction
  ) {
    const user = interaction.options.getUser("user") || interaction.user;

    if (!interaction.deferred) await interaction.deferReply();

    try {
      const data = await fetchJson<DiscordUserResponse>(
        `https://discord.com/api/v10/users/${user.id}`,
        { headers: { Authorization: `Bot ${process.env.BOT_TOKEN}` } }
      );

      if (!data.banner) {
        const embed = new EmbedBuilder()
          .setColor("Red")
          .setDescription("❌ | User does not have a banner.");
        return interaction.editReply({ embeds: [embed] });
      }

      const baseUrl = `https://cdn.discordapp.com/banners/${user.id}/${data.banner}`;
      const isAnimated = data.banner?.startsWith("a_");
      const description = isAnimated
        ? `[.gif](${baseUrl}.gif?size=1024) | [.webp](${baseUrl}.webp?size=1024)`
        : `[.jpg](${baseUrl}.jpg?size=1024) | [.png](${baseUrl}.png?size=1024) | [.webp](${baseUrl}.webp?size=1024)`;
      const displayUrl = isAnimated
        ? `${baseUrl}.gif?size=1024`
        : `${baseUrl}.png?size=1024`;

      const embed = new EmbedBuilder()
        .setTitle(`${user.username}'s Banner`)
        .setColor("#2b2d31")
        .setDescription(description)
        .setImage(displayUrl);

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      this.container.logger.error("Failed to fetch banner:", error);
      await interaction.editReply({
        content: "Failed to fetch the banner. Please try again later.",
      });
    }
  }
}
