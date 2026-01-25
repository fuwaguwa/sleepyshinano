import { ApplyOptions } from "@sapphire/decorators";
import type { Command } from "@sapphire/framework";
import { Subcommand, type SubcommandOptions } from "@sapphire/plugin-subcommands";
import {
  ActionRowBuilder,
  ApplicationIntegrationType,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  ComponentType,
  ContainerBuilder,
  InteractionContextType,
  MessageFlags,
  PermissionsBitField,
  SeparatorBuilder,
  TextDisplayBuilder,
} from "discord.js";
import { buttonInteractionCollectorCache } from "../../../shared/lib/collectors";
import { BOORU_SITES } from "../constants";
import { fetchBooruPosts } from "../lib/booru";
import { cleanBooruTags } from "../lib/utils";
import { AutobooruModel } from "../models/Autobooru";
import type { BooruSite } from "../types/API";
import type { AutobooruButtonOptions, AutobooruDocument } from "../types/Autobooru";
import type { AutobooruCollectorOptions, AutobooruHandleButtonsOptions } from "../types/Booru";

function createButtons(options: AutobooruButtonOptions) {
  const { showEnable, showDisable, disabled = false, userId } = options;

  const buttons = [];

  if (showEnable) {
    buttons.push(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Success)
        .setCustomId(`ABEnable-${userId}`)
        .setLabel("Start posting")
        .setDisabled(disabled)
    );
  }

  if (showDisable) {
    buttons.push(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Danger)
        .setCustomId(`ABDisable-${userId}`)
        .setLabel("Stop posting")
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

    const disabledText = new TextDisplayBuilder().setContent("✅ Autobooru has been disabled!");
    const container = new ContainerBuilder().addTextDisplayComponents(disabledText).setAccentColor([0, 255, 0]);
    return commandInteraction.editReply({ flags: MessageFlags.IsComponentsV2, components: [container] });
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

  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`## Autobooru has been ${isUpdate ? "updated" : "enabled"}!`),
      new TextDisplayBuilder().setContent(
        `User: <@${commandInteraction.user.id}>\nChannel: <#${commandInteraction.channelId}>\nTags: **${tags}**`
      )
    )
    .setAccentColor([0, 255, 0]);
  return commandInteraction.editReply({ flags: MessageFlags.IsComponentsV2, components: [container] });
}

async function setupCollector(options: AutobooruCollectorOptions) {
  const { response, interaction, site, tags, isRandom, isUpdate, showEnable, showDisable, container } = options;

  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 30000,
  });

  buttonInteractionCollectorCache.set(interaction.user.id, collector);

  collector.on("collect", async i => {
    if (!i.customId.endsWith(interaction.user.id)) {
      return i.reply({
        content: "This button is not for you!",
        flags: MessageFlags.Ephemeral,
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
      const clonedContainer = new ContainerBuilder(container.toJSON());
      const disabledButtons = createButtons({
        showEnable,
        showDisable,
        disabled: true,
        userId: interaction.user.id,
      });

      if (clonedContainer.data.components) {
        clonedContainer.data.components = clonedContainer.data.components.filter(
          comp => comp.type !== ComponentType.ActionRow
        );
      }

      clonedContainer.addActionRowComponents(disabledButtons);

      await interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [clonedContainer],
      });
    }
  });
}

@ApplyOptions<SubcommandOptions>({
  description: "Automatically post booru posts into a channel",
  fullCategory: ["PremiumNSFW"],
  cooldownDelay: 5000,
  preconditions: ["NotBlacklisted", "Voted"],
  nsfw: true,
  subcommands: BOORU_SITES.map(site => ({
    name: site,
    chatInputRun: "subcommandDefault",
  })),
})
export class AutobooruCommand extends Subcommand {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(builder =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
        .setContexts([InteractionContextType.Guild])
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageWebhooks)
        .setNSFW(true)
        .addSubcommand(cmd =>
          cmd
            .setName("gelbooru")
            .setDescription("Automatically post Gelbooru posts into this channel")
            .addStringOption(option =>
              option
                .setName("tags")
                .setDescription(
                  "Autocomplete enabled. Seperate multiple tags with space. E.g: shinano_(azur_lane) thigh_strap"
                )
                .setRequired(true)
                .setAutocomplete(true)
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
        )
        .addSubcommand(cmd =>
          cmd
            .setName("rule34")
            .setDescription("Automatically post Gelbooru posts into this channel")
            .addStringOption(option =>
              option
                .setName("tags")
                .setDescription(
                  "Autocomplete enabled. Seperate multiple tags with space. E.g: shinano_(azur_lane) thigh_strap"
                )
                .setRequired(true)
                .setAutocomplete(true)
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
        )
        .addSubcommand(cmd =>
          cmd
            .setName("safebooru")
            .setDescription("Automatically post Gelbooru posts into this channel")
            .addStringOption(option =>
              option
                .setName("tags")
                .setDescription(
                  "Autocomplete enabled. Seperate multiple tags with space. E.g: shinano_(azur_lane) thigh_strap"
                )
                .setRequired(true)
                .setAutocomplete(true)
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
        )
    );
  }

  public async subcommandDefault(interaction: Command.ChatInputCommandInteraction) {
    if (!interaction.deferred) await interaction.deferReply();

    if (interaction.channel?.type !== ChannelType.GuildText) {
      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent("❌ This command can only be used in a server text channel.")
        )
        .setAccentColor([255, 0, 0]);
      return interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: [container] });
    }

    const site = interaction.options.getSubcommand() as BooruSite;
    const tags = interaction.options.getString("tags", true);
    const mode = interaction.options.getString("mode");

    const testQuery = await fetchBooruPosts(site, tags, 0, mode === "random");
    if (testQuery.length === 0) {
      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            "❌ No posts were found with the provided tags. Please check your tags and try again"
          )
        )
        .setAccentColor([255, 0, 0]);
      return interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: [container] });
    }

    const filteredTags = cleanBooruTags(tags);
    const existingDoc = await AutobooruModel.findOne({ guildId: interaction.guildId }).lean<AutobooruDocument>();

    let container: ContainerBuilder;
    const showEnable: boolean = true;
    let showDisable: boolean;
    // const isSameChannel = existingDoc?.channelId === interaction.channelId;

    if (existingDoc) {
      // Show existing setup
      const separator = new SeparatorBuilder();
      container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent("## Autobooru has already been setup!"),
          new TextDisplayBuilder().setContent(
            `User: <@${existingDoc.userId}>\nChannel: <#${existingDoc.channelId}>\nSite: ${existingDoc.site}\nTag(s): **${existingDoc.tags}**\n`
          )
        )
        .addSeparatorComponents(separator)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `New User: ${interaction.user}\nNew Channel: ${interaction.channel}\nNew Site: ${site}\nNew Tag(s): **${filteredTags}**`
          )
        )
        .setAccentColor([255, 0, 0]);

      showDisable = true;
    } else {
      // No existing setup: only green button
      container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent("## Autobooru has not been enabled for this server!"),
          new TextDisplayBuilder().setContent(
            `Do you want Shinano to send booru posts into this channel?\nCurrent Site: **${site}**\nCurrent Tag(s): **${filteredTags}**\n\n**Make sure Shinano has the \`Send Message\` permission before continuing!**`
          )
        )
        .setAccentColor([255, 0, 0]);

      showDisable = false;
    }

    const row = createButtons({
      showEnable,
      showDisable,
      userId: interaction.user.id,
    });

    const separator = new SeparatorBuilder();
    container.addSeparatorComponents(separator).addActionRowComponents(row);

    const response = await interaction.editReply({
      flags: MessageFlags.IsComponentsV2,
      components: [container],
    });

    await setupCollector({
      response,
      interaction,
      site,
      tags: filteredTags,
      isRandom: mode === "random",
      isUpdate: existingDoc !== null,
      showEnable,
      showDisable,
      container,
    });
  }
}
