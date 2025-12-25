import { ApplyOptions } from "@sapphire/decorators";
import { CommandOptionsRunTypeEnum } from "@sapphire/framework";
import {
  Subcommand,
  type SubcommandOptions,
} from "@sapphire/plugin-subcommands";
import {
  ActionRowBuilder,
  ButtonBuilder,
  type ButtonInteraction,
  ButtonStyle,
  codeBlock,
  EmbedBuilder,
  type InteractionCollector,
  MessageFlagsBitField,
} from "discord.js";
import util from "util";
import { buttonCollector } from "../../lib/collectors";
import User from "../../schemas/User";

@ApplyOptions<SubcommandOptions>({
  description: "N/A",
  preconditions: ["OwnerOnly"],
  cooldownLimit: 1,
  cooldownDelay: 100000,
  cooldownFilteredUsers: process.env.OWNER_IDS?.split(",") || [],
  runIn: CommandOptionsRunTypeEnum.GuildAny,
  subcommands: [
    { name: "eval", chatInputRun: "subcommandEval" },
    { name: "vote-check", chatInputRun: "subcommandVote" },
    {
      name: "blacklist",
      type: "group",
      entries: [
        { name: "add", chatInputRun: "subcommandBLAdd" },
        { name: "remove", chatInputRun: "subcommandBLRemove" },
        { name: "check", chatInputRun: "subcommandBLCheck" },
      ],
    },
  ],
})
export class DeveloperCommand extends Subcommand {
  // ==================== Command Registration ====================
  public override async registerApplicationCommands(
    registry: Subcommand.Registry
  ) {
    registry.registerChatInputCommand(builder =>
      builder
        .setName(this.name)
        .setDescription("Developer-only commands")
        .addSubcommand(cmd =>
          cmd
            .setName("eval")
            .setDescription("Evaluate JavaScript code")
            .addStringOption(opt =>
              opt
                .setName("code")
                .setDescription("Code to evaluate")
                .setRequired(true)
            )
        )
        .addSubcommand(cmd =>
          cmd
            .setName("vote-check")
            .setDescription("Check a user's vote status")
            .addUserOption(opt =>
              opt
                .setName("user")
                .setDescription("User to check vote status")
                .setRequired(true)
            )
        )
        .addSubcommandGroup(group =>
          group
            .setName("blacklist")
            .setDescription("Manage blacklisted users")
            .addSubcommand(cmd =>
              cmd
                .setName("add")
                .setDescription("Add someone to the bot's blacklist")
                .addUserOption(opt =>
                  opt
                    .setName("user")
                    .setDescription("User to blacklist")
                    .setRequired(true)
                )
            )
            .addSubcommand(cmd =>
              cmd
                .setName("remove")
                .setDescription("Remove someone from the bot's blacklist")
                .addUserOption(opt =>
                  opt
                    .setName("user")
                    .setDescription("User to unblacklist")
                    .setRequired(true)
                )
            )
            .addSubcommand(cmd =>
              cmd
                .setName("check")
                .setDescription("Check if a user is blacklisted")
                .addUserOption(opt =>
                  opt
                    .setName("user")
                    .setDescription("User to check")
                    .setRequired(true)
                )
            )
        )
    );
  }

  // ==================== Subcommand Handlers ====================

  /**
   * /developer eval - Evaluate JavaScript code
   */
  public async subcommandEval(
    interaction: Subcommand.ChatInputCommandInteraction
  ) {
    if (!interaction.deferred) {
      await interaction.deferReply();
    }

    const code = interaction.options.getString("code", true);

    try {
      let output: any = await new Promise((resolve, _) => {
        resolve(eval(code));
      });

      if (typeof output !== "string") {
        output = util.inspect(output, { depth: 0 });
      }

      // Truncate if too long
      if (output.length > 1900) {
        output = output.substring(0, 1900) + "...";
      }

      await interaction.editReply({
        content: codeBlock("js", output),
      });
    } catch (error: any) {
      await interaction.editReply({
        content: codeBlock("js", `Error: ${error.message}`),
      });
    }
  }

  /**
   * /developer vote-check - Check user's vote status
   */
  public async subcommandVote(
    interaction: Subcommand.ChatInputCommandInteraction
  ) {
    if (!interaction.deferred) {
      await interaction.deferReply();
    }

    const user = interaction.options.getUser("user", true);
    const botId = this.container.client.user?.id || "1002193298229829682";

    // Check Shinano database
    const voteUser = await User.findOne({ userId: user.id });

    let voteStatus: boolean | string = false;
    let voteTime: number | string = "N/A";

    if (voteUser?.lastVoteTimestamp) {
      const currentTime = Math.floor(Date.now() / 1000);
      voteTime = voteUser.lastVoteTimestamp;
      voteStatus = currentTime - voteUser.lastVoteTimestamp < 43200; // 12 hours
    } else {
      voteStatus = "N/A";
    }

    // Check Top.gg database
    let topggVoteStatus = false;
    if (process.env.TOPGG_API_KEY) {
      try {
        const response = await fetch(
          `https://top.gg/api/bots/${botId}/check?userId=${user.id}`,
          {
            method: "GET",
            headers: {
              Authorization: process.env.TOPGG_API_KEY,
            },
          }
        );
        const topggResult = await response.json();
        topggVoteStatus = topggResult.voted === 1;
      } catch (error) {
        this.container.logger.error(
          "Failed to check Top.gg vote status:",
          error
        );
      }
    }

    const voteEmbed = new EmbedBuilder().setColor("#2b2d31").addFields(
      {
        name: "Top.gg Database:",
        value: `Voted: ${topggVoteStatus}`,
      },
      {
        name: "Shinano Database:",
        value:
          `Voted: ${voteStatus}\n` +
          `Last Voted: ${typeof voteTime === "number" ? `<t:${voteTime}:R> | <t:${voteTime}>` : "N/A"}`,
      }
    );

    const dbUpdate = new ActionRowBuilder<ButtonBuilder>().setComponents(
      new ButtonBuilder()
        .setLabel("Update user in database")
        .setEmoji({ name: "✅" })
        .setStyle(ButtonStyle.Success)
        .setCustomId("ADB")
        .setDisabled(false)
    );

    // Send message with button
    const message = await interaction.editReply({
      embeds: [voteEmbed],
      components: [dbUpdate],
    });

    // Create collector
    const collector = message.createMessageComponentCollector({
      time: 60000,
    });

    buttonCollector.set(interaction.user.id, collector);

    collector.on("collect", async collectedInteraction => {
      // Check if user is developer
      const i = collectedInteraction as ButtonInteraction;
      const ownerIds = process.env.OWNER_IDS?.split(",") || [];
      if (!ownerIds.includes(i.user.id)) {
        return i.reply({
          content: "This button is only for developers!",
          flags: MessageFlagsBitField.Flags.Ephemeral,
        });
      }

      // Update database
      await User.findOneAndUpdate(
        { userId: user.id },
        {
          $set: { lastVoteTimestamp: Math.floor(Date.now() / 1000) },
          $setOnInsert: { userId: user.id },
        },
        { upsert: true }
      );

      const updatedEmbed = new EmbedBuilder()
        .setColor("Green")
        .setDescription("✅ | Updated the database!");

      await i.reply({
        embeds: [updatedEmbed],
        flags: MessageFlagsBitField.Flags.Ephemeral,
      });

      collector.stop();
    });

    collector.on("end", async () => {
      dbUpdate.components[0].setDisabled(true);
      await interaction.editReply({ components: [dbUpdate] });
    });
  }

  /**
   * /developer blacklist add - Add user to blacklist
   */
  public async subcommandBLAdd(
    interaction: Subcommand.ChatInputCommandInteraction
  ) {
    if (!interaction.deferred) {
      await interaction.deferReply();
    }

    const targetUser = interaction.options.getUser("user", true);

    // Check if user exists and is already blacklisted
    const user = await User.findOne({ userId: targetUser.id });

    if (user?.blacklisted) {
      const alreadyBlacklisted = new EmbedBuilder()
        .setColor("Red")
        .setDescription(`${targetUser} has already been blacklisted!`);
      return interaction.editReply({ embeds: [alreadyBlacklisted] });
    }

    // Add to blacklist
    await User.findOneAndUpdate(
      { userId: targetUser.id },
      { $set: { blacklisted: true }, $setOnInsert: { userId: targetUser.id } },
      { upsert: true }
    );

    const success = new EmbedBuilder()
      .setColor("Green")
      .setDescription(`${targetUser} has been added to blacklist!`)
      .addFields({ name: "User ID", value: targetUser.id })
      .setTimestamp();

    await interaction.editReply({ embeds: [success] });
  }

  /**
   * /developer blacklist remove - Remove user from blacklist
   */
  public async subcommandBLRemove(
    interaction: Subcommand.ChatInputCommandInteraction
  ) {
    if (!interaction.deferred) {
      await interaction.deferReply();
    }

    const targetUser = interaction.options.getUser("user", true);

    // Check if user exists and is blacklisted
    const user = await User.findOne({ userId: targetUser.id });

    if (!user || !user.blacklisted) {
      const notBlacklisted = new EmbedBuilder()
        .setColor("Red")
        .setDescription("User is not blacklisted!");
      return interaction.editReply({ embeds: [notBlacklisted] });
    }

    // Remove from blacklist
    await user.updateOne({ blacklisted: false });

    const success = new EmbedBuilder()
      .setColor("Green")
      .setDescription(`${targetUser} has been removed from the blacklist!`)
      .setTimestamp();

    await interaction.editReply({ embeds: [success] });
  }

  /**
   * /developer blacklist check - Check if user is blacklisted
   */
  public async subcommandBLCheck(
    interaction: Subcommand.ChatInputCommandInteraction
  ) {
    if (!interaction.deferred) {
      await interaction.deferReply();
    }

    const targetUser = interaction.options.getUser("user", true);

    // Check if user exists
    const user = await User.findOne({ userId: targetUser.id });

    if (user?.blacklisted) {
      const blacklisted = new EmbedBuilder()
        .setColor("Red")
        .setTitle("Uh oh, user is blacklisted!")
        .addFields({ name: "User:", value: `${targetUser}` });
      await interaction.editReply({ embeds: [blacklisted] });
    } else {
      const notBlacklisted = new EmbedBuilder()
        .setColor("Green")
        .setDescription("User is not blacklisted!");
      await interaction.editReply({ embeds: [notBlacklisted] });
    }
  }
}
