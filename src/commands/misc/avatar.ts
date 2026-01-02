import { ApplyOptions } from "@sapphire/decorators";
import { Command, type CommandOptions } from "@sapphire/framework";
import { ApplicationIntegrationType, EmbedBuilder, InteractionContextType } from "discord.js";

@ApplyOptions<CommandOptions>({
  description: "Get an user's avatar",
  preconditions: ["NotBlacklisted"],
  cooldownLimit: 1,
  cooldownDelay: 3000,
  cooldownFilteredUsers: process.env.COOL_PEOPLE_IDS.split(","),
})
export class AvatarCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(builder =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .setIntegrationTypes([ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall])
        .setContexts([
          InteractionContextType.Guild,
          InteractionContextType.BotDM,
          InteractionContextType.PrivateChannel,
        ])
        .addUserOption(option => option.setName("user").setDescription("The user you want the command to be ran on."))
    );
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const user = interaction.options.getUser("user") || interaction.user;

    const baseUrl = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}`;
    const isAnimated = user.avatar?.startsWith("a_");
    const description = isAnimated
      ? `[.gif](${baseUrl}.gif?size=1024) | [.webp](${baseUrl}.webp?size=1024)`
      : `[.jpg](${baseUrl}.jpg?size=1024) | [.png](${baseUrl}.png?size=1024) | [.webp](${baseUrl}.webp?size=1024)`;
    const displayUrl = isAnimated ? `${baseUrl}.gif?size=1024` : `${baseUrl}.png?size=1024`;

    const embed = new EmbedBuilder()
      .setTitle(`${user.username}'s Avatar`)
      .setDescription(description)
      .setImage(displayUrl)
      .setColor("#2b2d31")
      .setFooter({ text: `UID: ${user.id}` });

    await interaction.reply({ embeds: [embed] });
  }
}
