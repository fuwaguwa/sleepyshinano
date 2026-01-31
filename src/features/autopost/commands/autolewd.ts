import { ApplyOptions } from "@sapphire/decorators";
import { Command, type CommandOptions } from "@sapphire/framework";
import {
  ActionRowBuilder,
  ApplicationIntegrationType,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  type ChatInputCommandInteraction,
  ComponentType,
  ContainerBuilder,
  InteractionContextType,
  MessageFlags,
  PermissionsBitField,
  SeparatorBuilder,
  TextDisplayBuilder,
} from "discord.js";
import { buttonInteractionCollectorCache } from "../../../shared/lib/collectors";
import { getCurrentTimestamp } from "../../../shared/lib/utils";
import type { LewdCategory } from "../../private/types/Lewd";
import { AUTOLEWD_POSTING_INTERVAL } from "../constants";
import { AutolewdModel } from "../models/Autolewd";
import type { AutolewdButtonOptions, AutolewdCollectorOptions, AutolewdHandleButtonOptions } from "../types/Autolewd";

function createButtons(options: AutolewdButtonOptions) {
  const { showEnable, showDisable, disabled = false, userId } = options;

  const buttons = [];

  if (showEnable) {
    buttons.push(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Success)
        .setCustomId(`ALEnable-${userId}`)
        .setLabel("Start posting")
        .setDisabled(disabled)
    );
  }

  if (showDisable) {
    buttons.push(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Danger)
        .setCustomId(`ALDisable-${userId}`)
        .setLabel("Stop posting")
        .setDisabled(disabled)
    );
  }

  return new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);
}

async function handleButtons(options: AutolewdHandleButtonOptions) {
  const { buttonInteraction, commandInteraction, category, isUpdate } = options;
  const action = buttonInteraction.customId.split("-")[0];

  if (action === "ALDisable") {
    await AutolewdModel.deleteOne({ guildId: commandInteraction.guildId });

    const disabledText = new TextDisplayBuilder().setContent("✅ Autolewd has been disabled!");
    const container = new ContainerBuilder().addTextDisplayComponents(disabledText).setAccentColor([0, 255, 0]);
    return commandInteraction.editReply({ flags: MessageFlags.IsComponentsV2, components: [container] });
  }

  // Enable/Update autolewd
  await AutolewdModel.updateOne(
    { guildId: commandInteraction.guild!.id },
    {
      $set: {
        guildId: commandInteraction.guild!.id,
        channelId: commandInteraction.channel!.id,
        userId: commandInteraction.user.id,
        category,
        nextPostTime: getCurrentTimestamp() * 1000 + AUTOLEWD_POSTING_INTERVAL,
      },
    },
    { upsert: true }
  );

  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`## Autolewd has been ${isUpdate ? "updated" : "enabled"}!`),
      new TextDisplayBuilder().setContent(
        `User: <@${commandInteraction.user.id}>\nChannel: <#${commandInteraction.channelId}>\nCategory: **${category}**`
      )
    )
    .setAccentColor([0, 255, 0]);
  return commandInteraction.editReply({ flags: MessageFlags.IsComponentsV2, components: [container] });
}

async function setupCollector(options: AutolewdCollectorOptions) {
  const { response, interaction, category, isUpdate, showEnable, showDisable, container } = options;

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
      category,
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

@ApplyOptions<CommandOptions>({
  description: "Automatically post lewd stuff into a channel",
  fullCategory: ["PremiumNSFW"],
  cooldownDelay: 15000,
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

  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    if (!interaction.deferred) await interaction.deferReply();

    if (interaction.channel?.type !== ChannelType.GuildText) {
      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent("❌ | Please run this command in a normal text channel")
        )
        .setAccentColor([255, 0, 0]);
      return interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: [container] });
    }

    const category = (interaction.options.getString("category") as LewdCategory) || "random";
    const existingDoc = await AutolewdModel.findOne({ guildId: interaction.guildId }).lean();

    let container: ContainerBuilder;
    const showEnable = true;
    let showDisable: boolean;
    // const isSameChannel = existingDoc?.channelId === interaction.channelId;

    if (existingDoc) {
      // Show existing setup
      const separator = new SeparatorBuilder();
      container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent("## Autolewd has already been setup!"),
          new TextDisplayBuilder().setContent(
            `User: <@${existingDoc.userId}>\nChannel: <#${existingDoc.channelId}>\nCategory: **${existingDoc.category}**`
          )
        )
        .addSeparatorComponents(separator)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `New User: ${interaction.user}\nNew Channel: ${interaction.channel}\nNew Category: **${category}**`
          )
        )
        .setAccentColor([255, 0, 0]);

      showDisable = true;
    } else {
      // No existing setup: only green button
      container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent("## Autolewd has not been enabled for this server!"),
          new TextDisplayBuilder().setContent(
            `Do you want Shinano to send lewd into this channel?\nSelected Category: **${category}**\n\n**Make sure Shinano has the \`Send Message\` permission before continuing!**`
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
      category,
      isUpdate: existingDoc !== null,
      showEnable,
      showDisable,
      container,
    });
  }
}
