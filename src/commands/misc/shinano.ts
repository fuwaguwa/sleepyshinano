import { ApplyOptions } from "@sapphire/decorators";
import { Subcommand, type SubcommandOptions } from "@sapphire/plugin-subcommands";
import {
  ActionRowBuilder,
  ApplicationIntegrationType,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  InteractionContextType,
  type TextChannel,
} from "discord.js";
import { isGroupDM, isUserDM, randomItem } from "../../lib/utils/misc";

const PAT_RESPONSES = ['"Aah... My ears are sensitive..."', '"Alas... This one\'s ears are sensitive..."'] as const;

@ApplyOptions<SubcommandOptions>({
  description: "silly commands",
  preconditions: ["NotBlacklisted"],
  cooldownLimit: 1,
  cooldownDelay: 5000,
  cooldownFilteredUsers: process.env.COOL_PEOPLE_IDS.split(",") || [],
  subcommands: [
    { name: "ping", chatInputRun: "subcommandPing" },
    { name: "info", chatInputRun: "subcommandInfo" },
    { name: "pat", chatInputRun: "subcommandPat" },
    { name: "stats", chatInputRun: "subcommandStats" },
    { name: "support", chatInputRun: "subcommandSupport" },
    { name: "vote", chatInputRun: "subcommandVote" },
    { name: "help", chatInputRun: "subcommandHelp" },
  ],
})
export class ShinanoCommand extends Subcommand {
  public override registerApplicationCommands(registry: Subcommand.Registry) {
    registry.registerChatInputCommand(builder =>
      builder
        .setName("shinano")
        .setDescription("Shinano Utilities Commands")
        .setIntegrationTypes([ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall])
        .setContexts([
          InteractionContextType.Guild,
          InteractionContextType.BotDM,
          InteractionContextType.PrivateChannel,
        ])
        .addSubcommand(command => command.setName("info").setDescription("Information about Shinano"))
        .addSubcommand(command => command.setName("ping").setDescription("Pong!"))
        .addSubcommand(command => command.setName("pat").setDescription("Headpats for the floof"))
        .addSubcommand(command => command.setName("stats").setDescription("Display Shinano's stats"))
        .addSubcommand(command => command.setName("support").setDescription("Got a problem? Run this command!"))
        .addSubcommand(command => command.setName("vote").setDescription("Vote for Shinano, or check your vote status"))
        .addSubcommand(command => command.setName("help").setDescription("How to look for all Shinano commands!"))
    );
  }

  /**
   * /shinano ping - Show bot latency
   */
  public async subcommandPing(interaction: Subcommand.ChatInputCommandInteraction) {
    const latency = Date.now() - interaction.createdTimestamp;
    const apiLatency = Math.round(this.container.client.ws.ping);

    const pingEmbed = new EmbedBuilder()
      .setTitle("Pong 🏓")
      .setDescription(`Latency: ${latency}ms\nAPI Latency: ${apiLatency}ms`)
      .setColor("#2b2d31");

    await interaction.reply({ embeds: [pingEmbed] });
  }

  /**
   * /shinano info - Show bot information
   */
  public async subcommandInfo(interaction: Subcommand.ChatInputCommandInteraction) {
    const shinanoEmbed = new EmbedBuilder()
      .setColor("#2b2d31")
      .setTitle("Shinano")
      .setDescription(
        "floofy great fox\n" +
          "Developer: [**Fuwafuwa**](https://github.com/fuwaguwa)\n" +
          "Credits: On GitHub\n" +
          "Liking the bot so far? Please **vote** and leave Shinano a **rating** on **top.gg**!"
      );

    const mainButtons = new ActionRowBuilder<ButtonBuilder>().setComponents(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setEmoji({ name: "👋" })
        .setLabel("Invite Shinano!")
        .setURL(
          `https://discord.com/api/oauth2/authorize?client_id=1002193298229829682&permissions=137439332480&scope=bot%20applications.commands`
        ),
      new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setEmoji({ name: "⚙️" })
        .setLabel("Support Server")
        .setURL("https://discord.gg/NFkMxFeEWr"),
      new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setEmoji({ id: "1065583023086641203" })
        .setLabel("GitHub")
        .setURL("https://github.com/fuwaguwa/sleepyshinano")
    );

    const linkButtons = new ActionRowBuilder<ButtonBuilder>().setComponents(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setEmoji({ id: "1002849574517477447" })
        .setLabel("top.gg")
        .setURL(`https://top.gg/bot/1002193298229829682`)
    );

    await interaction.reply({
      embeds: [shinanoEmbed],
      components: [mainButtons, linkButtons],
    });
  }

  /**
   * /shinano pat - Give Shinano headpats
   */
  public async subcommandPat(interaction: Subcommand.ChatInputCommandInteraction) {
    const embed = new EmbedBuilder()
      .setColor("#2b2d31")
      .setDescription(randomItem(PAT_RESPONSES))
      .setImage(
        "https://cdn.discordapp.com/attachments/1002189321631187026/1034474955116662844/shinano_azur_lane_drawn_by_nagi_ria__3c37724853c358bebf5bc5668e0d4314_1.gif"
      );

    await interaction.reply({ embeds: [embed] });
  }

  /**
   * /shinano stats - Display bot statistics
   */
  public async subcommandStats(interaction: Subcommand.ChatInputCommandInteraction) {
    if (!interaction.deferred) await interaction.deferReply();

    // Calculate uptime
    const uptime = this.container.client.uptime || 0;
    let totalSeconds = uptime / 1000;
    const days = Math.floor(totalSeconds / 86400);
    totalSeconds %= 86400;
    const hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);

    let uptimeString = "";
    if (days > 0) uptimeString += `${days} days, `;
    uptimeString += `${hours} hours, ${minutes} minutes, ${seconds} seconds`;

    const embed = new EmbedBuilder()
      .setColor("#2b2d31")
      .setTitle("Shinano's Stats")
      .addFields(
        { name: "Uptime:", value: uptimeString },
        {
          name: "Bot Stats:",
          value: `Total Guilds: **${this.container.client.guilds.cache.size}**\n`,
        }
      );

    await interaction.editReply({ embeds: [embed] });
  }

  /**
   * /shinano support - Show support server link
   */
  public async subcommandSupport(interaction: Subcommand.ChatInputCommandInteraction) {
    const supportEmbed = new EmbedBuilder()
      .setColor("#2b2d31")
      .setDescription(
        "If you encounter any issues pertaining to my services, kindly reach out to my creator through the support server provided below..."
      );

    const supportButton = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setLabel("Support Server")
        .setEmoji({ name: "⚙️" })
        .setURL("https://discord.gg/NFkMxFeEWr")
    );

    await interaction.reply({
      embeds: [supportEmbed],
      components: [supportButton],
    });
  }

  /**
   * /shinano vote - Show voting links
   */
  public async subcommandVote(interaction: Subcommand.ChatInputCommandInteraction) {
    if (!interaction.deferred) {
      await interaction.deferReply();
    }

    const voteEmbed = new EmbedBuilder()
      .setColor("#2b2d31")
      .setDescription(
        "You may cast your vote for me down below. I express my gratitude for your unwavering support!\n"
      );

    const links = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setLabel("Vote on top.gg")
        .setEmoji({ id: "1002849574517477447" })
        .setURL(`https://top.gg/bot/1002193298229829682/vote`),
      new ButtonBuilder()
        .setStyle(ButtonStyle.Secondary)
        .setLabel("Check top.gg Vote")
        .setEmoji({ name: "🔍" })
        .setCustomId("voteCheck")
    );

    await interaction.editReply({
      embeds: [voteEmbed],
      components: [links],
    });
  }

  /**
   * /shinano help - Show help information
   */
  public async subcommandHelp(interaction: Subcommand.ChatInputCommandInteraction) {
    const messageString = "</shinano support:1059059516081192961>";
    let message =
      `All of Shinano functions are indexed within the \`Apps & Commands\` button. Please use it to see all available Shinano commands! For more information you can join the support server via ${messageString}\n\n` +
      "**NSFW commands are only available within NSFW channels! RUN THIS COMMAND IN A NSFW TO SEE MORE.**\n";

    console.log(!isGroupDM(interaction) && !isUserDM(interaction));
    if (!isGroupDM(interaction) && !isUserDM(interaction) && (interaction.channel as TextChannel).nsfw) {
      const commandStore = this.container.stores.get("commands");
      const nsfwCommands = commandStore.filter(command => command.category === "NSFW");
      const premiumNsfwCommands = commandStore.filter(command => command.category === "PremiumNSFW");
      message = "\n**NSFW Commands:**\n";
      nsfwCommands.forEach(command => {
        message += `\`/${command.name}\` `;
      });
      message += "\n\n**Premium NSFW Commands (Requires Voting):**\n";
      premiumNsfwCommands.forEach(command => {
        message += `\`/${command.name}\` `;
      });
    }

    const responseEmbed = new EmbedBuilder()
      .setColor("#2b2d31")
      .setDescription(message)
      .setImage(
        "https://cdn.discordapp.com/attachments/1022191350835331203/1280481895536267287/Discord_OsMDlfJqTX.png?ex=66d83d32&is=66d6ebb2&hm=9baf7360168e1d2a815b86882fcfa0869e1868513136cef33fd62f99a8abeb31&"
      );

    await interaction.reply({ embeds: [responseEmbed] });
  }
}
