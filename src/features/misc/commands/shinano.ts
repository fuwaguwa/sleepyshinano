import { ApplyOptions } from "@sapphire/decorators";
import { Subcommand, type SubcommandOptions } from "@sapphire/plugin-subcommands";
import {
  ActionRowBuilder,
  ApplicationIntegrationType,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  InteractionContextType,
  MediaGalleryBuilder,
  MessageFlags,
  SectionBuilder,
  SeparatorBuilder,
  type TextChannel,
  TextDisplayBuilder,
  ThumbnailBuilder,
} from "discord.js";
import { TOPGG_BASE_URL, TOPGG_EMOJI_ID, TOPGG_VOTE_URL } from "../../../shared/constants";
import { processBooruRequest } from "../../booru/lib/booru";
import { isGroupDM, isUserDM } from "../../booru/lib/utils";

@ApplyOptions<SubcommandOptions>({
  description: "silly commands",
  preconditions: ["NotBlacklisted"],
  cooldownDelay: 5000,
  cooldownFilteredUsers: process.env.COOL_PEOPLE_IDS.split(","),
  subcommands: [
    { name: "ping", chatInputRun: "subcommandPing" },
    { name: "info", chatInputRun: "subcommandInfo" },
    { name: "pat", chatInputRun: "subcommandPat" },
    { name: "stats", chatInputRun: "subcommandStats" },
    { name: "support", chatInputRun: "subcommandSupport" },
    { name: "vote", chatInputRun: "subcommandVote" },
    { name: "help", chatInputRun: "subcommandHelp" },
    { name: "image", chatInputRun: "subcommandImage" },
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
        .addSubcommand(command => command.setName("image").setDescription("Get a random image of Shinano"))
    );
  }

  /**
   * /shinano ping - Show bot latency
   */
  public async subcommandPing(interaction: Subcommand.ChatInputCommandInteraction) {
    const latency = Date.now() - interaction.createdTimestamp;
    const apiLatency = Math.round(this.container.client.ws.ping);

    const containerComponent = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent("## Pong 🏓"),
      new TextDisplayBuilder().setContent(`**Latency**: ${latency}ms\n**API Latency**: ${apiLatency}ms`)
    );

    return interaction.reply({
      flags: MessageFlags.IsComponentsV2,
      components: [containerComponent],
    });
  }

  /**
   * /shinano info - Show bot information
   */
  public async subcommandInfo(interaction: Subcommand.ChatInputCommandInteraction) {
    const shinanoInfo = new TextDisplayBuilder().setContent(
      "## Shinano\n" +
        "floofy sleepy great big squishy fox\n\n" +
        "Developer: furafu\n" +
        "Credits: On GitHub\n\n" +
        "-# Liking the bot so far? Please **vote** and leave Shinano a rating on top.gg!"
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
        .setURL("https://github.com/fuwaguwa/sleepyshinano"),
      new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setEmoji({ id: TOPGG_EMOJI_ID })
        .setLabel("top.gg")
        .setURL(TOPGG_BASE_URL)
    );

    const avatarThumbnail = new ThumbnailBuilder({
      media: {
        url: this.container.client.user?.displayAvatarURL({ extension: "png", size: 1024 }) as string,
      },
    });

    const section1 = new SectionBuilder().addTextDisplayComponents(shinanoInfo).setThumbnailAccessory(avatarThumbnail);
    const separator = new SeparatorBuilder();

    const containerComponent = new ContainerBuilder()
      .addSectionComponents(section1)
      .addSeparatorComponents(separator)
      .addActionRowComponents(mainButtons);

    await interaction.reply({
      flags: MessageFlags.IsComponentsV2,
      components: [containerComponent],
    });
  }

  /**
   * /shinano pat - Give Shinano headpats
   */
  public async subcommandPat(interaction: Subcommand.ChatInputCommandInteraction) {
    const textDisplay = new TextDisplayBuilder().setContent("-# pat pat pat");
    const gifDisplay = new MediaGalleryBuilder().addItems([
      {
        media: {
          url: "https://cdn.discordapp.com/attachments/1002189321631187026/1034474955116662844/shinano_azur_lane_drawn_by_nagi_ria__3c37724853c358bebf5bc5668e0d4314_1.gif",
        },
      },
    ]);

    const containerComponent = new ContainerBuilder()
      .addTextDisplayComponents(textDisplay)
      .addMediaGalleryComponents(gifDisplay);

    await interaction.reply({
      flags: MessageFlags.IsComponentsV2,
      components: [containerComponent],
    });
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

    const titleText = new TextDisplayBuilder().setContent("## Shinano's Stats");
    const uptimeText = new TextDisplayBuilder().setContent(`**Uptime**: ${uptimeString}`);
    const totalGuildsText = new TextDisplayBuilder().setContent(
      `**Total Guilds**: ${this.container.client.guilds.cache.size}`
    );

    const containerComponent = new ContainerBuilder().addTextDisplayComponents(titleText, uptimeText, totalGuildsText);

    await interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: [containerComponent] });
  }

  /**
   * /shinano support - Show support server link
   */
  public async subcommandSupport(interaction: Subcommand.ChatInputCommandInteraction) {
    const descriptionText = new TextDisplayBuilder().setContent(
      "If you encounter any issues pertaining to my services, kindly reach out to my creator through the support server provided below..."
    );

    const supportButton = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setLabel("Support Server")
        .setEmoji({ name: "⚙️" })
        .setURL("https://discord.gg/NFkMxFeEWr")
    );

    const separator = new SeparatorBuilder();
    const containerComponent = new ContainerBuilder()
      .addTextDisplayComponents(descriptionText)
      .addSeparatorComponents(separator)
      .addActionRowComponents(supportButton);

    await interaction.reply({ flags: MessageFlags.IsComponentsV2, components: [containerComponent] });
  }

  /**
   * /shinano vote - Show voting links
   */
  public async subcommandVote(interaction: Subcommand.ChatInputCommandInteraction) {
    const voteText = new TextDisplayBuilder().setContent(
      "You may cast your vote for me down below. I express my gratitude for your unwavering support!"
    );
    const links = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setLabel("Vote on top.gg")
        .setEmoji({ id: TOPGG_EMOJI_ID })
        .setURL(TOPGG_VOTE_URL),
      new ButtonBuilder()
        .setStyle(ButtonStyle.Secondary)
        .setLabel("Check top.gg Vote")
        .setEmoji({ name: "🔍" })
        .setCustomId("voteCheck")
    );

    const separator = new SeparatorBuilder();
    const containerComponent = new ContainerBuilder()
      .addTextDisplayComponents(voteText)
      .addSeparatorComponents(separator)
      .addActionRowComponents(links);

    await interaction.reply({ flags: MessageFlags.IsComponentsV2, components: [containerComponent] });
  }

  /**
   * /shinano help - Show help information
   */
  public async subcommandHelp(interaction: Subcommand.ChatInputCommandInteraction) {
    const messageString = "</shinano support:1059059516081192961>";
    let message =
      `All of Shinano functions are indexed within the \`Apps & Commands\` button. Please use it to see all available Shinano commands! For more information you can join the support server via ${messageString}\n\n` +
      "**NSFW commands are only available within NSFW channels! RUN THIS COMMAND IN A NSFW TO SEE MORE.**\n";

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

    const descriptionText = new TextDisplayBuilder().setContent(message);
    const tutorialImage = new MediaGalleryBuilder().addItems([
      {
        media: {
          url: "https://cdn.discordapp.com/attachments/1022191350835331203/1280481895536267287/Discord_OsMDlfJqTX.png?ex=66d83d32&is=66d6ebb2&hm=9baf7360168e1d2a815b86882fcfa0869e1868513136cef33fd62f99a8abeb31&",
        },
      },
    ]);

    const containerComponent = new ContainerBuilder()
      .addTextDisplayComponents(descriptionText)
      .addMediaGalleryComponents(tutorialImage);

    await interaction.reply({ flags: MessageFlags.IsComponentsV2, components: [containerComponent] });
  }

  /**
   * /shinaono image - Get a random image of Shinano
   */
  public async subcommandImage(interaction: Subcommand.ChatInputCommandInteraction) {
    if (!interaction.deferred) await interaction.deferReply();

    await processBooruRequest({ interaction, tags: "shinano_(azur_lane)", site: "safebooru", noTagsOnReply: true });
  }
}
