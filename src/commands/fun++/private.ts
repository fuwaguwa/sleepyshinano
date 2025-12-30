import { ApplyOptions } from "@sapphire/decorators";
import { Subcommand, type SubcommandOptions } from "@sapphire/plugin-subcommands";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import { fetchRandomLewd } from "../../lib/utils/db";
import { randomItem } from "../../lib/utils/misc";

@ApplyOptions<SubcommandOptions>({
  description: "NSFW commands that requires voting.",
  fullCategory: ["PremiumNSFW"],
  preconditions: ["NotBlacklisted", "Voted"],
  cooldownLimit: 1,
  cooldownDelay: 30000,
  cooldownFilteredUsers: process.env.COOL_PEOPLE_IDS.split(",") || [],
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
            `❌ | No images found${category ? ` in the **${category}** category` : ""}${format ? ` with **${format}** format` : ""}.`
          );
        return interaction.editReply({ embeds: [errorEmbed] });
      }

      // If bomb mode, just send links
      if (bomb) {
        const links = results.map(media => media.link).join("\n");
        return interaction.editReply({ content: links });
      }

      // Single image mode
      const media = results[0];

      // If animated, just send the link
      if (media.format === "animated") return interaction.editReply({ content: media.link });

      // If static image, send embed with button (no button for premium)
      const embed = new EmbedBuilder()
        .setColor("Random")
        .setImage(media.link)
        .setFooter({
          text: `Requested by ${interaction.user.username}`,
          iconURL: interaction.user.displayAvatarURL({ forceStatic: false }),
        });

      // Only add button for non-premium commands
      if (!isPremium) {
        const row = new ActionRowBuilder<ButtonBuilder>().setComponents(
          new ButtonBuilder()
            .setStyle(ButtonStyle.Secondary)
            .setCustomId(`getSauce`)
            .setLabel("Get Sauce")
            .setEmoji({ name: "🔍" })
        );

        return interaction.editReply({
          embeds: [embed],
          components: [row],
        });
      }

      await interaction.editReply({
        embeds: [embed],
      });
    } catch (error) {
      this.container.logger.error(
        `Error in private command (category: ${category}, premium: ${isPremium}, format: ${format}):`,
        error
      );
      const errorEmbed = new EmbedBuilder()
        .setColor("Red")
        .setDescription(`❌ | An error occurred while fetching an image. Please try again later.`);
      return interaction.editReply({ embeds: [errorEmbed] });
    }
  }
}
