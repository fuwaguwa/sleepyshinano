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
import { cleanBooruTags } from "../../lib/utils/misc";
import { AutobooruModel } from "../../models/Autobooru";
import type { BooruSite } from "../../typings/api/booru";
import type { AutobooruCollectorOptions, AutobooruHandleButtonsOptions } from "../../typings/booru";
import type { AutolewdButtonOptions } from "../../typings/lewd";
import type { AutobooruDocument } from "../../typings/models/Autobooru";

function createButtons(options: AutolewdButtonOptions) {
  const { showEnable, showDisable, disabled = false, userId } = options;

  const buttons = [];

  if (showEnable) {
    buttons.push(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Success)
        .setCustomId(`ABEnable-${userId}`)
        .setLabel("Send posts to this channel!")
        .setDisabled(disabled)
    );
  }

  if (showDisable) {
    buttons.push(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Danger)
        .setCustomId(`ABDisable-${userId}`)
        .setLabel("Stop your debauchery!")
        .setDisabled(disabled)
    );
  }

  return new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);
}

async function handleButtons(options: AutobooruHandleButtonsOptions) {
  const { buttonInteraction, commandInteraction, site, tags, isRandom, isUpdate } = options;
  const action = buttonInteraction.customId.split("-")[0];

  if (action === "ABDisable") {
    await AutobooruModel.deleteOne({ guildId: commandInteraction.guildId });

    const embed = new EmbedBuilder().setColor("Green").setDescription("✅ | Autobooru has been disabled!");

    return commandInteraction.editReply({ embeds: [embed], components: [] });
  }

  // Enable/Update autobooru
  await AutobooruModel.updateOne(
    { guildId: commandInteraction.guild!.id },
    {
      $set: {
        guildId: commandInteraction.guild!.id,
        channelId: commandInteraction.channel!.id,
        userId: commandInteraction.user.id,
        site,
        tags,
        isRandom,
      },
    },
    { upsert: true }
  );

  const embed = new EmbedBuilder()
    .setColor("Green")
    .setTitle(`Autobooru has been ${isUpdate ? "updated" : "enabled"}!`)
    .setDescription(
      `User: <@${commandInteraction.user.id}>\n` + `Channel: <#${commandInteraction.channelId}>\n` + `Tags: **${tags}**`
    );

  return commandInteraction.editReply({ embeds: [embed], components: [] });
}

async function setupCollector(options: AutobooruCollectorOptions) {
  const { response, interaction, site, tags, isRandom, isUpdate, showEnable, showDisable } = options;

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
      site,
      tags,
      isRandom,
      isUpdate,
    });

    collector.stop("finished");
  });

  collector.on("end", async (_, reason) => {
    if (reason !== "finished") {
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
  description: "Automatically post booru posts into a channel",
  fullCategory: ["PremiumNSFW"],
  cooldownLimit: 1,
  cooldownDelay: 15000,
  cooldownFilteredUsers: process.env.COOL_PEOPLE_IDS.split(","),
  preconditions: ["NotBlacklisted", "Voted", "InMainServer"],
  nsfw: true,
})
export class AutobooruCommand extends Command {
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
            .setName("site")
            .setDescription("Booru site you want posts from")
            .setRequired(true)
            .setChoices({ name: "Gelbooru", value: "gelbooru" }, { name: "Rule34", value: "rule34" })
        )
        .addStringOption(option =>
          option
            .setName("tags")
            .setDescription("NO AUTOCOMPLETE. RUN THE NORMAL BOORU COMMANDS TO SEE VALID TAGS!")
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName("mode")
            .setDescription("Booru query mode. Default is Weighted")
            .setChoices(
              { name: "Random - get a random post", value: "random" },
              { name: "Weighted - experimental: get high(er) quality post", value: "weighted" }
            )
        )
    );
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    if (!interaction.deferred) await interaction.deferReply();

    if (interaction.channel?.type !== ChannelType.GuildText) {
      const errorEmbed = new EmbedBuilder()
        .setColor("Red")
        .setDescription("❌ | This command can only be used in a server text channel.");

      return interaction.editReply({ embeds: [errorEmbed] });
    }

    const site = interaction.options.getString("site", true) as BooruSite;
    const tags = interaction.options.getString("tags", true);
    const mode = interaction.options.getString("mode");

    const filteredTags = cleanBooruTags(tags);
    const existingDoc = await AutobooruModel.findOne({ guildId: interaction.guildId }).lean<AutobooruDocument>();

    let embed: EmbedBuilder;
    let showEnable: boolean;
    let showDisable: boolean;
    const isSameChannel = existingDoc?.channelId === interaction.channelId;

    if (existingDoc) {
      // Show existing setup
      embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("Autobooru has already been setup!")
        .setDescription(
          `User: <@${existingDoc.userId}>\n` +
            `Channel: <#${existingDoc.channelId}>\n` +
            `Tags: **${existingDoc.tags}**`
        );

      showEnable = !isSameChannel;
      showDisable = true;
    } else {
      // No existing setup: only green button
      embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("Autobooru has not been enabled for this server!")
        .setDescription(
          `Do you want Shinano to send booru posts into this channel? Current tags: **${tags}**\n` +
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
      site,
      tags: filteredTags,
      isRandom: mode === "random",
      isUpdate: existingDoc !== null,
      showEnable,
      showDisable,
    });
  }
}
