import { ApplyOptions } from "@sapphire/decorators";
import { Command, type CommandOptions } from "@sapphire/framework";
import { EmbedBuilder } from "discord.js";
import { standardCommandOptions } from "../../lib/utils/command";

@ApplyOptions<CommandOptions>({
  description: "Roll a dice.",
  ...standardCommandOptions,
})
export class RollCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(builder =>
      builder
        .setName(this.name)
        .setDescription("Roll a dice.")
        .addIntegerOption(option =>
          option
            .setName("range")
            .setDescription("How many faces the dice have.")
            .setRequired(true)
        )
    );
  }

  public override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction
  ) {
    const range = interaction.options.getInteger("range", true);
    const dice = Math.floor(range * Math.random());

    const diceEmbed = new EmbedBuilder()
      .setDescription(`You rolled **${dice}**`)
      .setColor("#2b2d31");

    await interaction.reply({ embeds: [diceEmbed] });
  }
}
