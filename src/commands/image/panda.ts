import { ApplyOptions } from "@sapphire/decorators";
import { Command, type CommandOptions } from "@sapphire/framework";
import { EmbedBuilder } from "discord.js";

@ApplyOptions<CommandOptions>({
  description: "Pandas.",
  cooldownLimit: 1,
  cooldownDelay: 4500,
  cooldownFilteredUsers: process.env.OWNER_IDS?.split(",") || [],
  preconditions: ["NotBlacklisted"],
})
export class PandaCommand extends Command {
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
      const response = await fetch("https://some-random-api.com/animal/panda");
      const data = await response.json();

      const pandaEmbed = new EmbedBuilder()
        .setColor("Random")
        .setImage(data.image)
        .setFooter({
          text: `Requested by ${interaction.user.username}`,
          iconURL: interaction.user.displayAvatarURL({ forceStatic: false }),
        });

      await interaction.editReply({ embeds: [pandaEmbed] });
    } catch (error) {
      this.container.logger.error("Failed to fetch panda:", error);
      await interaction.editReply({
        content: "Failed to fetch a panda image. Please try again later.",
      });
    }
  }
}
