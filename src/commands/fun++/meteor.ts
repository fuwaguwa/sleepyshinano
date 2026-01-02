import { ApplyOptions } from "@sapphire/decorators";
import { Subcommand, type SubcommandOptions } from "@sapphire/plugin-subcommands";
import { EmbedBuilder } from "discord.js";
import { fetchRandomLewd } from "../../lib/utils/db";

@ApplyOptions<SubcommandOptions>({
  description: "Meteor shower of NSFW images.",
  fullCategory: ["PremiumNSFW"],
  preconditions: ["NotBlacklisted", "Voted"],
  cooldownLimit: 1,
  cooldownDelay: 300000,
  cooldownFilteredUsers: process.env.COOL_PEOPLE_IDS.split(","),
  subcommands: [
    { name: "shower", chatInputRun: "subcommandShower", preconditions: ["InMainServer"] },
    {
      name: "premium",
      type: "group",
      entries: [{ name: "shower", chatInputRun: "subcommandPremiumShower", preconditions: ["InMainServer"] }],
    },
  ],
})
export class MeteorCommand extends Subcommand {
  public override async registerApplicationCommands(registry: Subcommand.Registry) {
    registry.registerChatInputCommand(builder =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .setNSFW(true)
        .addSubcommand(command =>
          command
            .setName("shower")
            .setDescription("Rain down 50 random NSFW images from private database")
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
        )
        .addSubcommandGroup(group =>
          group
            .setName("premium")
            .setDescription("Premium meteor shower")
            .addSubcommand(command =>
              command
                .setName("shower")
                .setDescription("HIGH QUALITY: Rain down 50 random NSFW images from private database")
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
            )
        )
    );
  }

  public async subcommandShower(interaction: Subcommand.ChatInputCommandInteraction) {
    return this.handleMeteorShower(interaction, false);
  }

  public async subcommandPremiumShower(interaction: Subcommand.ChatInputCommandInteraction) {
    return this.handleMeteorShower(interaction, true);
  }

  private async handleMeteorShower(interaction: Subcommand.ChatInputCommandInteraction, isPremium: boolean) {
    if (!interaction.deferred) await interaction.deferReply();

    const categoryOption = interaction.options.getString("category") as
      | "hoyo"
      | "kemonomimi"
      | "misc"
      | "shipgirls"
      | "undies"
      | null;

    try {
      const totalImages = 50;
      const batchSize = 5;
      const batchCount = totalImages / batchSize;
      const delayBetweenBatches = 2500;

      // Initial response
      const initialEmbed = new EmbedBuilder().setColor("Red").setDescription(`🌠 Meteor shower incoming!`);
      await interaction.editReply({ embeds: [initialEmbed] });

      // Send batches
      for (let i = 0; i < batchCount; i++) {
        // Wait {delayBetweenBatches / 1000} seconds between batches (except for the first one)
        if (i > 0) await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));

        try {
          // If no category specified, fetch from all categories (truly random)
          const results = await fetchRandomLewd({
            category: categoryOption ?? undefined,
            isPremium,
            limit: batchSize,
          });

          if (results.length === 0) {
            const errorEmbed = new EmbedBuilder()
              .setColor("Red")
              .setDescription(`❌ | No more images found. Stopped at batch ${i + 1}/${batchCount}.`);
            await interaction.followUp({ embeds: [errorEmbed] });
            break;
          }

          const links = results.map(media => media.link).join("\n");
          await interaction.followUp({ content: links });
        } catch (error) {
          this.container.logger.error(`Error in meteor shower batch ${i + 1}:`, error);
          const errorEmbed = new EmbedBuilder()
            .setColor("Red")
            .setDescription(`❌ | Error occurred at batch ${i + 1}/${batchCount}. Stopping meteor shower.`);
          await interaction.followUp({ embeds: [errorEmbed] });
          break;
        }
      }

      // Final completion message
      const completionEmbed = new EmbedBuilder().setColor("Green").setDescription(`✅ Meteor shower complete!`);
      await interaction.followUp({ embeds: [completionEmbed] });
    } catch (error) {
      this.container.logger.error(
        `Error in meteor command (category: ${categoryOption}, premium: ${isPremium}):`,
        error
      );
      const errorEmbed = new EmbedBuilder()
        .setColor("Red")
        .setDescription(`❌ | An error occurred while starting the meteor shower. Please try again later.`);
      return interaction.editReply({ embeds: [errorEmbed] });
    }
  }
}
