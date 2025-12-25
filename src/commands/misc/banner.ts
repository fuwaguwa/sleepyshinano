import { ApplyOptions } from "@sapphire/decorators";
import {
  Command,
  type CommandOptions,
  CommandOptionsRunTypeEnum,
} from "@sapphire/framework";
import { EmbedBuilder } from "discord.js";

@ApplyOptions<CommandOptions>({
  description: "Get a user's banner",
  preconditions: ["NotBlacklisted"],
  cooldownLimit: 1,
  cooldownDelay: 3000,
  cooldownFilteredUsers: process.env.COOL_PEOPLE_IDS?.split(",") || [],
  runIn: CommandOptionsRunTypeEnum.GuildAny,
})
export class BannerCommand extends Command {
  // ==================== Command Registration ====================

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

  // ==================== Command Handlers ====================

  /**
   * /banner
   * Grabs an user's banner
   */
  public override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction
  ) {
    const user = interaction.options.getUser("user") || interaction.user;

    if (!interaction.deferred) {
      await interaction.deferReply();
    }

    const response = await fetch(
      `https://discord.com/api/v10/users/${user.id}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bot ${process.env.BOT_TOKEN}`,
        },
      }
    );

    const received = await response.json();

    if (!received.banner) {
      const failedEmbed = new EmbedBuilder()
        .setColor("Red")
        .setDescription("❌ | User does not have a banner.");
      return interaction.editReply({ embeds: [failedEmbed] });
    }

    const baseUrl = `https://cdn.discordapp.com/banners/${user.id}/${received.banner}`;

    let description: string;
    let displayUrl: string;

    if (received.banner.startsWith("a_")) {
      description = `[.gif](${baseUrl}.gif?size=1024) | [.webp](${baseUrl}.webp?size=1024)`;
      displayUrl = `${baseUrl}.gif?size=1024`;
    } else {
      description = `[.jpg](${baseUrl}.jpg?size=1024) | [.png](${baseUrl}.png?size=1024) | [.webp](${baseUrl}.webp?size=1024)`;
      displayUrl = `${baseUrl}.png?size=1024`;
    }

    const banner = new EmbedBuilder()
      .setTitle(`${user.username}'s Banner`)
      .setColor("#2b2d31")
      .setDescription(description)
      .setImage(displayUrl);

    await interaction.editReply({ embeds: [banner] });
  }
}
