import { ApplyOptions } from "@sapphire/decorators";
import { Subcommand, type SubcommandOptions } from "@sapphire/plugin-subcommands";
import {
  ActionRowBuilder,
  ApplicationIntegrationType,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  EmbedBuilder,
  InteractionContextType,
  MediaGalleryBuilder,
  MessageFlags,
  SeparatorBuilder,
  TextDisplayBuilder,
} from "discord.js";
import { randomItem } from "../../../shared/lib/utils";
import { fetchRandomLewd } from "../lib/lewd";

@ApplyOptions<SubcommandOptions>({
  description: "NSFW commands that requires voting.",
  cooldownDelay: 5000,
  fullCategory: ["PremiumNSFW"],
  preconditions: ["NotBlacklisted", "Voted"],
  subcommands: [
    { name: "hoyo", chatInputRun: "subcommandDefault" },
    { name: "kemonomimi", chatInputRun: "subcommandDefault" },
    { name: "shipgirls", chatInputRun: "subcommandDefault" },
    { name: "undies", chatInputRun: "subcommandDefault" },
    { name: "misc", chatInputRun: "subcommandDefault" },
    { name: "animated", chatInputRun: "subcommandAnimated" },
    { name: "random", chatInputRun: "subcommandRandom" },
    {
      name: "premium",
      type: "group",
      entries: [
        { name: "hoyo", chatInputRun: "subcommandPremium", preconditions: ["InMainServer"] },
        { name: "kemonomimi", chatInputRun: "subcommandPremium", preconditions: ["InMainServer"] },
        { name: "shipgirls", chatInputRun: "subcommandPremium", preconditions: ["InMainServer"] },
        { name: "undies", chatInputRun: "subcommandPremium", preconditions: ["InMainServer"] },
        { name: "misc", chatInputRun: "subcommandPremium", preconditions: ["InMainServer"] },
        { name: "random", chatInputRun: "subcommandPremiumRandom", preconditions: ["InMainServer"] },
      ],
    },
  ],
})
export class PrivateCommand extends Subcommand {
  public override async registerApplicationCommands(registry: Subcommand.Registry) {
    registry.registerChatInputCommand(builder =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .setNSFW(true)
        .setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
        .setContexts([InteractionContextType.Guild])
        .addSubcommand(command =>
          command
            .setName("hoyo")
            .setDescription("HoyoVerse Girls (Honkai, Genshin, Zenless)")
            .addBooleanOption(option =>
              option.setName("bomb").setDescription("Bomb you with 5 images from this category").setRequired(false)
            )
        )
        .addSubcommand(command =>
          command
            .setName("kemonomimi")
            .setDescription("Animal girls (catgirls, foxgirls, elves, etc)")
            .addBooleanOption(option =>
              option.setName("bomb").setDescription("Bomb you with 5 images from this category").setRequired(false)
            )
        )
        .addSubcommand(command =>
          command
            .setName("shipgirls")
            .setDescription("Azur Lane shipgirls!")
            .addBooleanOption(option =>
              option.setName("bomb").setDescription("Bomb you with 5 images from this category").setRequired(false)
            )
        )
        .addSubcommand(command =>
          command
            .setName("undies")
            .setDescription("Panties, lingeries, swimsuits ")
            .addBooleanOption(option =>
              option.setName("bomb").setDescription("Bomb you with 5 images from this category").setRequired(false)
            )
        )
        .addSubcommand(command =>
          command
            .setName("misc")
            .setDescription("Everything else that is not listed in /premium.")
            .addBooleanOption(option =>
              option.setName("bomb").setDescription("Bomb you with 5 images from this category").setRequired(false)
            )
        )
        .addSubcommand(command =>
          command
            .setName("animated")
            .setDescription("Animated GIFs and videos")
            .addStringOption(option =>
              option
                .setName("category")
                .setDescription("Choose a specific category")
                .setRequired(false)
                .addChoices(
                  { name: "HoyoVerse", value: "hoyo" },
                  { name: "Kemonomimi", value: "kemonomimi" },
                  { name: "Shipgirls", value: "shipgirls" },
                  { name: "Undies", value: "undies" },
                  { name: "Misc", value: "misc" }
                )
            )
            .addBooleanOption(option =>
              option.setName("bomb").setDescription("Bomb you with 5 images from this category").setRequired(false)
            )
        )
        .addSubcommand(command =>
          command
            .setName("random")
            .setDescription("Random image from any category")
            .addBooleanOption(option =>
              option.setName("bomb").setDescription("Bomb you with 5 images from random categories").setRequired(false)
            )
        )
        .addSubcommandGroup(group =>
          group
            .setName("premium")
            .setDescription("Premium NSFW content")
            .addSubcommand(command =>
              command
                .setName("hoyo")
                .setDescription("HIGH QUALITY: HoyoVerse Girls (Honkai, Genshin, Zenless)")
                .addBooleanOption(option =>
                  option.setName("bomb").setDescription("Bomb you with 5 images from this category").setRequired(false)
                )
            )
            .addSubcommand(command =>
              command
                .setName("kemonomimi")
                .setDescription("HIGH QUALITY: Animal girls (catgirls, foxgirls, elves, etc)")
                .addBooleanOption(option =>
                  option.setName("bomb").setDescription("Bomb you with 5 images from this category").setRequired(false)
                )
            )
            .addSubcommand(command =>
              command
                .setName("shipgirls")
                .setDescription("HIGH QUALITY: Azur Lane shipgirls!")
                .addBooleanOption(option =>
                  option.setName("bomb").setDescription("Bomb you with 5 images from this category").setRequired(false)
                )
            )
            .addSubcommand(command =>
              command
                .setName("undies")
                .setDescription("HIGH QUALITY: Panties, lingeries, swimsuits ")
                .addBooleanOption(option =>
                  option.setName("bomb").setDescription("Bomb you with 5 images from this category").setRequired(false)
                )
            )
            .addSubcommand(command =>
              command
                .setName("misc")
                .setDescription("HIGH QUALITY: Everything else that is not listed in /premium.")
                .addBooleanOption(option =>
                  option.setName("bomb").setDescription("Bomb you with 5 images from this category").setRequired(false)
                )
            )
            .addSubcommand(command =>
              command
                .setName("random")
                .setDescription("HIGH QUALITY: Random image from any category")
                .addBooleanOption(option =>
                  option
                    .setName("bomb")
                    .setDescription("Bomb you with 5 images from random categories")
                    .setRequired(false)
                )
            )
        )
    );
  }

  public async subcommandDefault(interaction: Subcommand.ChatInputCommandInteraction) {
    const category = interaction.options.getSubcommand() as "hoyo" | "kemonomimi" | "misc" | "shipgirls" | "undies";
    return this.handleCommand(interaction, { category, isPremium: false });
  }

  public async subcommandPremium(interaction: Subcommand.ChatInputCommandInteraction) {
    const category = interaction.options.getSubcommand() as "hoyo" | "kemonomimi" | "misc" | "shipgirls" | "undies";
    return this.handleCommand(interaction, { category, isPremium: true });
  }

  public async subcommandAnimated(interaction: Subcommand.ChatInputCommandInteraction) {
    const categoryOption = interaction.options.getString("category") as
      | "hoyo"
      | "kemonomimi"
      | "misc"
      | "shipgirls"
      | "undies"
      | null;
    const category = categoryOption ?? randomItem(["hoyo", "kemonomimi", "misc", "shipgirls", "undies"] as const);
    return this.handleCommand(interaction, { category, isPremium: false, format: "animated" });
  }

  public async subcommandRandom(interaction: Subcommand.ChatInputCommandInteraction) {
    return this.handleCommand(interaction, { isPremium: false, isRandom: true });
  }

  public async subcommandPremiumRandom(interaction: Subcommand.ChatInputCommandInteraction) {
    return this.handleCommand(interaction, { isPremium: true, isRandom: true });
  }

  private async handleCommand(
    interaction: Subcommand.ChatInputCommandInteraction,
    options: {
      category?: "hoyo" | "kemonomimi" | "misc" | "shipgirls" | "undies";
      isPremium: boolean;
      format?: "image" | "animated";
      isRandom?: boolean;
    }
  ) {
    if (!interaction.deferred) await interaction.deferReply();

    const { category, isPremium, format, isRandom } = options;
    const bomb = interaction.options.getBoolean("bomb") ?? false;

    try {
      const limit = bomb ? 5 : 1;

      // Don't specify category if isRandom is true - let MongoDB pick from all categories
      const results = await fetchRandomLewd({
        category: isRandom ? undefined : category,
        isPremium,
        format,
        limit,
      });

      if (results.length === 0) {
        const errorEmbed = new EmbedBuilder()
          .setColor("Red")
          .setDescription(
            `❌ No images found${category ? ` in the **${category}** category` : ""}${format ? ` with **${format}** format` : ""}.`
          );
        return interaction.editReply({ embeds: [errorEmbed] });
      }

      // If bomb mode, just send links
      if (bomb) {
        const gallery = new MediaGalleryBuilder().addItems(results.map(media => ({ media: { url: media.link } })));
        const footer = new TextDisplayBuilder().setContent(
          `-# Requested by @${interaction.user.username} | <t:${Math.floor(Date.now() / 1000)}:R>`
        );
        const container = new ContainerBuilder().addMediaGalleryComponents(gallery).addTextDisplayComponents(footer);
        return interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: [container] });
      }

      // Single image mode
      const media = results[0];

      // If animated, put in a container with gallery and footer (no getSauce button)
      if (media.format === "animated") {
        const gallery = new MediaGalleryBuilder().addItems([{ media: { url: media.link } }]);
        const footer = new TextDisplayBuilder().setContent(
          `-# Requested by @${interaction.user.username} | <t:${Math.floor(Date.now() / 1000)}:R>`
        );
        const container = new ContainerBuilder().addMediaGalleryComponents(gallery).addTextDisplayComponents(footer);
        return interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: [container] });
      }

      // If static image, use components v2 (gallery + button if not premium)
      const gallery = new MediaGalleryBuilder().addItems([{ media: { url: media.link } }]);
      const footer = new TextDisplayBuilder().setContent(
        `-# Requested by @${interaction.user.username} | <t:${Math.floor(Date.now() / 1000)}:R>`
      );
      const container = new ContainerBuilder().addMediaGalleryComponents(gallery).addTextDisplayComponents(footer);

      if (!isPremium) {
        const button = new ButtonBuilder()
          .setStyle(ButtonStyle.Secondary)
          .setCustomId(`getSauce`)
          .setLabel("Get Sauce")
          .setEmoji({ name: "🔍" });

        const separator = new SeparatorBuilder();
        const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(button);
        container.addSeparatorComponents(separator).addActionRowComponents(actionRow);
      }

      return interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: [container] });
    } catch (error) {
      this.container.logger.error(
        `Error in private command (category: ${category}, premium: ${isPremium}, format: ${format}):`,
        error
      );
      const errorMessage = new TextDisplayBuilder().setContent(
        `❌ An error occurred while fetching an image. Please try again later.`
      );
      const errorContainer = new ContainerBuilder().addTextDisplayComponents(errorMessage).setAccentColor([255, 0, 0]);
      return interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: [errorContainer] });
    }
  }
}
