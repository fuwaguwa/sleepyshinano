import { ApplyOptions } from "@sapphire/decorators";
import {
  type ApplicationCommandRegistry,
  CommandOptionsRunTypeEnum,
} from "@sapphire/framework";
import {
  Subcommand,
  type SubcommandOptions,
} from "@sapphire/plugin-subcommands";
import { EmbedBuilder, type User } from "discord.js";

@ApplyOptions<SubcommandOptions>({
  description: "Get an user's avatar",
  preconditions: ["NotBlacklisted"],
  cooldownLimit: 1,
  cooldownDelay: 3000,
  cooldownFilteredUsers: process.env.COOL_PEOPLE_IDS?.split(",") || [],
  runIn: CommandOptionsRunTypeEnum.GuildAny,
  subcommands: [
    {
      name: "global",
      chatInputRun: "subcommandGlobal",
    },
    {
      name: "guild",
      chatInputRun: "subcommandGuild",
    },
  ],
})
export class AvatarCommand extends Subcommand {
  // ==================== Command Registration ====================

  public override registerApplicationCommands(
    registry: ApplicationCommandRegistry
  ) {
    registry.registerChatInputCommand(builder =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addSubcommand(cmd =>
          cmd
            .setName("global")
            .setDescription("Get an user's global avatar")
            .addUserOption(option =>
              option
                .setName("user")
                .setDescription("The user you want the command to be ran on.")
            )
        )
        .addSubcommand(cmd =>
          cmd
            .setName("guild")
            .setDescription("Get an user's server/guild avatar")
            .addUserOption(option =>
              option
                .setName("user")
                .setDescription("The user you want the command to be ran on.")
            )
        )
    );
  }

  // ==================== Command Handlers ====================

  /**
   * /avatar global
   * Grabs an user's global avatar
   */
  public async subcommandGlobal(
    interaction: Subcommand.ChatInputCommandInteraction
  ) {
    const user = interaction.options.getUser("user") || interaction.user;
    await this.sendAvatar(interaction, user);
  }

  /**
   * /avatar guild
   * Grabs an user's guild avatar
   */
  public async subcommandGuild(
    interaction: Subcommand.ChatInputCommandInteraction
  ) {
    const user = interaction.options.getUser("user") || interaction.user;

    if (!interaction.guild) {
      const errorEmbed = new EmbedBuilder()
        .setColor("Red")
        .setDescription("❌ | This command can only be used in a server!");
      return interaction.reply({ embeds: [errorEmbed] });
    }

    try {
      const guildUser = await interaction.guild.members.fetch(user);
      await this.sendAvatar(interaction, guildUser.user);
    } catch (_) {
      const errorEmbed = new EmbedBuilder()
        .setColor("Red")
        .setDescription(
          "❌ | User is not in the guild, please use `/avatar global` instead!"
        );
      return interaction.reply({ embeds: [errorEmbed] });
    }
  }

  /**
   * Send the avatar embed
   */
  private async sendAvatar(
    interaction: Subcommand.ChatInputCommandInteraction,
    user: User
  ) {
    const avatar = user.avatar;
    const baseUrl = `https://cdn.discordapp.com/avatars/${user.id}/${avatar}`;

    let description: string;
    let displayUrl: string;

    if (avatar?.startsWith("a_")) {
      description = `[.gif](${baseUrl}.gif?size=1024) | [.webp](${baseUrl}.webp?size=1024)`;
      displayUrl = `${baseUrl}.gif?size=1024`;
    } else {
      description = `[.jpg](${baseUrl}.jpg?size=1024) | [.png](${baseUrl}.png?size=1024) | [.webp](${baseUrl}.webp?size=1024)`;
      displayUrl = `${baseUrl}.png?size=1024`;
    }

    const avatarEmbed = new EmbedBuilder()
      .setTitle(`${user.username}'s Avatar`)
      .setDescription(description)
      .setImage(displayUrl)
      .setColor("#2b2d31")
      .setFooter({ text: `UID: ${user.id}` });
    await interaction.reply({ embeds: [avatarEmbed] });
  }
}
