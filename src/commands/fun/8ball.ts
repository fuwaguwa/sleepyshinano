import { ApplyOptions } from "@sapphire/decorators";
import { Command, type CommandOptions } from "@sapphire/framework";
import { type ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { standardCommandOptions } from "../../lib/utils/command";
import { randomItem } from "../../lib/utils/misc";

const RESPONSES = [
  "As I see it, yes.",
  "Kindly inquire again at a later time.",
  "It would be preferable not to disclose that information at this moment.",
  "I am unable to provide a prediction at the moment...",
  "Focus your thoughts and pose the question once more.",
  "I advise against relying on it.",
  "It is certain.",
  "It is decidedly so.",
  "Most likely.",
  "Regrettably, my response is in the negative.",
  "According to my sources, the answer is in the negative.",
  "The outlook appears to be unfavorable.",
  "The outlook seems promising.",
  "The response remains uncertain. Please attempt your inquiry once more.",
  "The signs indicate an affirmative response.",
  "Highly doubtful, I'm afraid.",
  "Without a doubt.",
  "Yes.",
  "Indeed, without a doubt.",
  "You may rely on it.",
] as const;

@ApplyOptions<CommandOptions>({
  description: "Ask 8Ball",
  ...standardCommandOptions,
})
export class EightBallCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(builder =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption(option => option.setName("question").setDescription("Your question.").setRequired(true))
    );
  }

  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const question = interaction.options.getString("question", true);

    const embed = new EmbedBuilder().setColor("#2b2d31").setDescription(`> **${question}**\n${randomItem(RESPONSES)}`);

    await interaction.reply({ embeds: [embed] });
  }
}
