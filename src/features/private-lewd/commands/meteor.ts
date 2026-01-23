import { ApplyOptions } from "@sapphire/decorators";
import { Subcommand, type SubcommandOptions } from "@sapphire/plugin-subcommands";
import {
  ApplicationIntegrationType,
  ContainerBuilder,
  InteractionContextType,
  MediaGalleryBuilder,
  MessageFlags,
  TextDisplayBuilder,
} from "discord.js";
import { fetchRandomLewd } from "../lib/lewd";

@ApplyOptions<SubcommandOptions>({
  description: "Meteor shower of NSFW images.",
  fullCategory: ["PremiumNSFW"],
  preconditions: ["NotBlacklisted", "Voted"],
  cooldownDelay: 300000,
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
        .setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
        .setContexts([InteractionContextType.Guild])
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
      const timestamp = Math.floor(Date.now() / 1000);

      // Initial response
      const initialMsg = new TextDisplayBuilder().setContent(`🌠 Meteor shower incoming!`);
      const initialContainer = new ContainerBuilder().addTextDisplayComponents(initialMsg).setAccentColor([255, 0, 0]);
      await interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: [initialContainer] });

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
            const errorMsg = new TextDisplayBuilder().setContent(
              `❌ No more images found. Stopped at batch ${i + 1}/${batchCount}.`
            );
            const errorContainer = new ContainerBuilder()
              .addTextDisplayComponents(errorMsg)
              .setAccentColor([255, 0, 0]);
            await interaction.followUp({ flags: MessageFlags.IsComponentsV2, components: [errorContainer] });
            break;
          }

          const gallery = new MediaGalleryBuilder().addItems(results.map(media => ({ media: { url: media.link } })));
          const footer = new TextDisplayBuilder().setContent(
            `-# Requested by @${interaction.user.username} | <t:${timestamp}:R>`
          );
          const container = new ContainerBuilder().addMediaGalleryComponents(gallery).addTextDisplayComponents(footer);
          await interaction.followUp({ flags: MessageFlags.IsComponentsV2, components: [container] });
        } catch (error) {
          this.container.logger.error(`Error in meteor shower batch ${i + 1}:`, error);
          const errorMsg = new TextDisplayBuilder().setContent(
            `❌ Error occurred at batch ${i + 1}/${batchCount}. Stopping meteor shower.`
          );
          const errorContainer = new ContainerBuilder().addTextDisplayComponents(errorMsg).setAccentColor([255, 0, 0]);
          await interaction.followUp({ flags: MessageFlags.IsComponentsV2, components: [errorContainer] });
          break;
        }
      }

      // Final completion message
      const completionMsg = new TextDisplayBuilder().setContent(`✅ Meteor shower complete!`);
      const completionContainer = new ContainerBuilder()
        .addTextDisplayComponents(completionMsg)
        .setAccentColor([0, 255, 0]);
      await interaction.followUp({ flags: MessageFlags.IsComponentsV2, components: [completionContainer] });
    } catch (error) {
      this.container.logger.error(
        `Error in meteor command (category: ${categoryOption}, premium: ${isPremium}):`,
        error
      );
      const errorMsg = new TextDisplayBuilder().setContent(
        `❌ An error occurred while starting the meteor shower. Please try again later.`
      );
      const errorContainer = new ContainerBuilder().addTextDisplayComponents(errorMsg).setAccentColor([255, 0, 0]);
      return interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: [errorContainer] });
    }
  }
}
