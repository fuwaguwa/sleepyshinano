import { ApplyOptions } from "@sapphire/decorators";
import { Command, type CommandOptions } from "@sapphire/framework";
import { EmbedBuilder } from "discord.js";
import { standardCommandOptions } from "../../lib/utils";

@ApplyOptions<CommandOptions>({
  name: "match",
  description: "Check 2 people's love meter",
  ...standardCommandOptions,
})
export class MatchCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(builder =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addUserOption(option =>
          option
            .setName("user1")
            .setDescription("First person")
            .setRequired(true)
        )
        .addUserOption(option =>
          option
            .setName("user2")
            .setDescription("Second person")
            .setRequired(true)
        )
    );
  }

  public override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction
  ) {
    const user1 = interaction.options.getUser("user1", true);
    const user2 = interaction.options.getUser("user2", true);

    const love = Math.round(Math.random() * 100);
    const loveIndex = Math.floor(love / 10);
    const loveLevel = "💖".repeat(loveIndex) + "💔".repeat(10 - loveIndex);

    const loveEmbed = new EmbedBuilder()
      .setColor("Red")
      .setTitle("Love Percentage 💘")
      .setDescription(
        `${user1} and ${user2} love percentage: ${love}%\n\n${loveLevel}`
      );

    await interaction.reply({ embeds: [loveEmbed] });
  }
}
