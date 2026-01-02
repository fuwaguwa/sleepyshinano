import { ApplyOptions } from "@sapphire/decorators";
import { Command, type CommandOptions } from "@sapphire/framework";
import {
  ActionRowBuilder,
  ApplicationIntegrationType,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  ComponentType,
  EmbedBuilder,
  InteractionContextType,
  MessageFlagsBitField,
  PermissionsBitField,
} from "discord.js";
import { buttonCollector } from "../../lib/collectors";
import Autolewd from "../../schemas/Autolewd";
import type {
  AutolewdButtonOptions,
  AutolewdCollectorOptions,
  AutolewdHandleButtonOptions,
  LewdCategory,
} from "../../typings/lewd";

function createButtons(options: AutolewdButtonOptions) {
  const { showEnable, showDisable, disabled = false, userId } = options;

  const buttons = [];

  if (showEnable) {
    buttons.push(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Success)
        .setCustomId(`ALEnable-${userId}`)
        .setLabel("Send lewd to this channel!")
        .setDisabled(disabled)
    );
  }

  if (showDisable) {
    buttons.push(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Danger)
        .setCustomId(`ALDisable-${userId}`)
        .setLabel("Stop your debauchery!")
        .setDisabled(disabled)
    );
  }

  return new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);
}

async function handleButtons(options: AutolewdHandleButtonOptions) {
  const { buttonInteraction, commandInteraction, category, isUpdate } = options;
  const action = buttonInteraction.customId.split("-")[0];

  if (action === "ALDisable") {
    await Autolewd.deleteOne({ guildId: commandInteraction.guildId });

    const embed = new EmbedBuilder().setColor("Green").setDescription("✅ | Autolewd has been disabled!");

    return commandInteraction.editReply({ embeds: [embed], components: [] });
  }

  // Enable/Update autolewd
  await Autolewd.updateOne(
    { guildId: commandInteraction.guild!.id },
    {
      $set: {
        guildId: commandInteraction.guild!.id,
        channelId: commandInteraction.channel!.id,
        userId: commandInteraction.user.id,
        category,
      },
    },
    { upsert: true }
  );

  const embed = new EmbedBuilder()
    .setColor("Green")
    .setTitle(`Autolewd has been ${isUpdate ? "updated" : "enabled"}!`)
    .setDescription(
      `User: <@${commandInteraction.user.id}>\n` +
        `Channel: <#${commandInteraction.channelId}>\n` +
        `Category: **${category}**`
    );

  return commandInteraction.editReply({ embeds: [embed], components: [] });
}

async function setupCollector(options: AutolewdCollectorOptions) {
  const { response, interaction, category, isUpdate, showEnable, showDisable } = options;

  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 30000,
  });

  buttonCollector.set(interaction.user.id, collector);

  collector.on("collect", async i => {
    if (!i.customId.endsWith(interaction.user.id)) {
      return i.reply({
        content: "This button is not for you!",
        flags: MessageFlagsBitField.Flags.Ephemeral,
      });
    }

    await i.deferUpdate();
    await handleButtons({
      buttonInteraction: i,
      commandInteraction: interaction,
      category,
      isUpdate,
    });

    collector.stop("finished");
  });

  collector.on("end", async (_, reason) => {
    if (reason !== "finished") {
      // Disable all currently shown buttons
      const disabledRows = createButtons({
        showEnable,
        showDisable,
        disabled: true,
        userId: interaction.user.id,
      });

      await interaction.editReply({ components: [disabledRows] }).catch(() => {});
    }
  });
}

@ApplyOptions<CommandOptions>({
  description: "Automatically post lewd stuff into a channel",
  fullCategory: ["NSFW"],
  cooldownLimit: 1,
  cooldownDelay: 15000,
  cooldownFilteredUsers: process.env.COOL_PEOPLE_IDS.split(",") || [],
  preconditions: ["NotBlacklisted", "Voted", "InMainServer"],
  nsfw: true,
})
export class AutolewdCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(builder =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
        .setContexts([InteractionContextType.Guild])
        .setNSFW(true)
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageWebhooks)
        .addStringOption(option =>
          option
            .setName("category")
            .setDescription("Category of lewd images to post")
            .setRequired(false)
            .addChoices(
              { name: "HoyoVerse Girls", value: "hoyo" },
              { name: "Kemonomimi", value: "kemonomimi" },
              { name: "Shipgirls", value: "shipgirls" },
              { name: "Undies", value: "undies" },
              { name: "Misc", value: "misc" }
            )
        )
    );
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    if (!interaction.deferred) await interaction.deferReply();

    if (interaction.channel?.type !== ChannelType.GuildText) {
      const errorEmbed = new EmbedBuilder()
        .setColor("Red")
        .setDescription("❌ | Please run this command in a normal text channel");

      return interaction.editReply({ embeds: [errorEmbed] });
    }

    const category = (interaction.options.getString("category") as LewdCategory) || "random";
    const existingDoc = await Autolewd.findOne({ guildId: interaction.guildId }).lean();

    let embed: EmbedBuilder;
    let showEnable: boolean;
    let showDisable: boolean;
    const isSameChannel = existingDoc?.channelId === interaction.channelId;

    if (existingDoc) {
      // Show existing setup
      embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("Autolewd has already been setup!")
        .setDescription(
          `User: <@${existingDoc.userId}>\n` +
            `Channel: <#${existingDoc.channelId}>\n` +
            `Category: **${existingDoc.category}**`
        );

      if (isSameChannel) {
        // Same channel: only red button
        showEnable = false;
        showDisable = true;
      } else {
        // Different channel: both buttons
        showEnable = true;
        showDisable = true;
      }
    } else {
      // No existing setup: only green button
      embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("Autolewd has not been enabled for this server!")
        .setDescription(
          `Do you want Shinano to send lewd into this channel? Current selected category: **${category}**\n` +
            `\n**Make sure Shinano has the \`Send Message\` permission before continuing!**`
        );

      showEnable = true;
      showDisable = false;
    }

    const row = createButtons({
      showEnable,
      showDisable,
      userId: interaction.user.id,
    });

    const response = await interaction.editReply({ embeds: [embed], components: [row] });

    await setupCollector({
      response,
      interaction,
      category,
      isUpdate: existingDoc !== null,
      showEnable,
      showDisable,
    });
  }
}
