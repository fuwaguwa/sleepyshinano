import { ApplyOptions } from "@sapphire/decorators";
import { Command, type CommandOptions } from "@sapphire/framework";
import { type ChatInputCommandInteraction, ContainerBuilder, MessageFlags, TextDisplayBuilder } from "discord.js";

@ApplyOptions<CommandOptions>({
  description: "Check 2 people's love meter",
  preconditions: ["NotBlacklisted"],
})
export class MatchCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(builder =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addUserOption(option => option.setName("user1").setDescription("First person").setRequired(true))
        .addUserOption(option => option.setName("user2").setDescription("Second person").setRequired(true))
    );
  }

  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const user1 = interaction.options.getUser("user1", true);
    const user2 = interaction.options.getUser("user2", true);

    const love = Math.round(Math.random() * 100);
    const loveIndex = Math.floor(love / 10);
    const loveLevel = "💖".repeat(loveIndex) + "💔".repeat(10 - loveIndex);

    const matchText = new TextDisplayBuilder().setContent(
      `## Love Percentage 💘\n\n` + `${user1} and ${user2} love percentage: ${love}%\n\n${loveLevel}`
    );
    const containerComponent = new ContainerBuilder().addTextDisplayComponents(matchText);

    await interaction.reply({ flags: MessageFlags.IsComponentsV2, components: [containerComponent] });
  }
}
