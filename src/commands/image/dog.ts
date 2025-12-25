import { ApplyOptions } from "@sapphire/decorators";
import { Command, type CommandOptions } from "@sapphire/framework";
import { EmbedBuilder } from "discord.js";

@ApplyOptions<CommandOptions>({
  description: "Get an image of a dog!",
  cooldownLimit: 1,
  cooldownDelay: 4500,
  cooldownFilteredUsers: process.env.OWNER_IDS?.split(",") || [],
  preconditions: ["NotBlacklisted"],
})
export class DogCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(builder =>
      builder.setName(this.name).setDescription(this.description)
    );
  }

  public override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction
  ) {
    if (!interaction.deferred) await interaction.deferReply();

    try {
      const response = await fetch("https://some-random-api.com/animal/dog");
      const data = await response.json();

      const dogEmbed = new EmbedBuilder()
        .setColor("Random")
        .setImage(data.image)
        .setFooter({
          text: `Requested by ${interaction.user.username}`,
          iconURL: interaction.user.displayAvatarURL({ forceStatic: false }),
        });

      await interaction.editReply({ embeds: [dogEmbed] });
    } catch (error) {
      this.container.logger.error("Failed to fetch dog:", error);
      await interaction.editReply({
        content: "Failed to fetch a dog image. Please try again later.",
      });
    }
  }
}
