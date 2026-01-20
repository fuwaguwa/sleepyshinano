import { ApplyOptions } from "@sapphire/decorators";
import { Command, type CommandOptions } from "@sapphire/framework";
import {
  ActionRowBuilder,
  ApplicationIntegrationType,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  ComponentType,
  ContainerBuilder,
  InteractionContextType,
  MessageFlagsBitField,
  PermissionsBitField,
  SeparatorBuilder,
  TextDisplayBuilder,
} from "discord.js";
import { fetchBooruPosts } from "../../lib/booru";
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

    const container = new ContainerBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent("✅ Autobooru has been disabled!"))
      .setAccentColor([0, 255, 0]);
    return commandInteraction.editReply({ flags: MessageFlagsBitField.Flags.IsComponentsV2, components: [container] });
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
  return commandInteraction.editReply({ flags: MessageFlagsBitField.Flags.IsComponentsV2, components: [container] });
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
  preconditions: ["NotBlacklisted", "Voted"],
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
      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent("❌ This command can only be used in a server text channel.")
        )
        .setAccentColor([255, 0, 0]);
      return interaction.editReply({ flags: MessageFlagsBitField.Flags.IsComponentsV2, components: [container] });
    }

    const site = interaction.options.getString("site", true) as BooruSite;
    const tags = interaction.options.getString("tags", true);
    const mode = interaction.options.getString("mode");

    const testQuery = await fetchBooruPosts(site, tags, 0, mode === "random");
    if (testQuery.length === 0) {
      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            "❌ No posts were found with the provided tags. Please check your tags and try again.\n\n" +
              "HINT: Try running `/gelbooru` or `/rule34`, the autocomplete helps you validate your tags, and then you can use them here!"
          )
        )
        .setAccentColor([255, 0, 0]);
      return interaction.editReply({ flags: MessageFlagsBitField.Flags.IsComponentsV2, components: [container] });
    }

    const filteredTags = cleanBooruTags(tags);
    const existingDoc = await AutobooruModel.findOne({ guildId: interaction.guildId }).lean<AutobooruDocument>();

    let container: ContainerBuilder;
    let showEnable: boolean;
    let showDisable: boolean;
    const isSameChannel = existingDoc?.channelId === interaction.channelId;

    if (existingDoc) {
      // Show existing setup
      container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent("## Autobooru has already been setup!"),
          new TextDisplayBuilder().setContent(
            `User: <@${existingDoc.userId}>\nChannel: <#${existingDoc.channelId}>\nTags: **${existingDoc.tags}**`
          )
        )
        .setAccentColor([255, 0, 0]);
      showEnable = !isSameChannel;
      showDisable = true;
    } else {
      // No existing setup: only green button
      container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent("## Autobooru has not been enabled for this server!"),
          new TextDisplayBuilder().setContent(
            `Do you want Shinano to send booru posts into this channel? Current tags: **${tags}**\n\n**Make sure Shinano has the \`Send Message\` permission before continuing!**`
          )
        )
        .setAccentColor([255, 0, 0]);
      showEnable = true;
      showDisable = false;
    }

    const row = createButtons({
      showEnable,
      showDisable,
      userId: interaction.user.id,
    });

    container.addSeparatorComponents(new SeparatorBuilder());
    container.addActionRowComponents(row);
    const response = await interaction.editReply({
      flags: MessageFlagsBitField.Flags.IsComponentsV2,
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
    });
  }
}
