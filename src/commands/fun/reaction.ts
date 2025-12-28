import { ApplyOptions } from "@sapphire/decorators";
import { Subcommand, type SubcommandOptions } from "@sapphire/plugin-subcommands";
import { ApplicationIntegrationType, EmbedBuilder, InteractionContextType, type User } from "discord.js";
import { standardCommandOptions } from "../../lib/utils/command";
import { fetchJson } from "../../lib/utils/http";

import type { NekosBestResponse } from "../../typings/api/misc";

// Message templates: [messageWithTarget, messageWithoutTarget?]
// {user} = interaction user, {target} = target user
const REACTION_MESSAGES: Record<string, readonly [string, string?]> = {
  bite: ["{user} bit {target}!", "You bit yourself...wtf?"],
  blush: ["{user} blushed!"],
  bored: ["{user} is bored..."],
  cuddle: ["{user} cuddled with {target}!", "You cuddled with yourself?"],
  handhold: ["{user} held {target}'s hand!", "You held hands with yourself..."],
  highfive: ["{user} highfived {target}", "You highfived yourself?"],
  hug: ["{user} hugged {target}!", "You hugged yourself?"],
  kick: ["{user} kicked {target}!", "You kicked yourself?"],
  kiss: ["{user} kissed {target}!", "You kissed yourself?"],
  nod: [""],
  pat: ["{user} headpatted {target}!", "You headpatted yourself?"],
  poke: ["{user} poked {target}!", "You poked yourself?"],
  punch: ["{user} punched {target}!", "You punched yourself?"],
  slap: ["{user} slapped {target}!", "You slapped yourself?"],
  sleep: ["Shh...{user} is sleeping!"],
  stare: ["{user} is staring at {target}!", "You are staring at yourself?"],
  think: ["{user} is cooking up something malicious..."],
  tickle: ["{user} tickled {target}!", "You tickled yourself?"],
  yeet: ["{user} yeeted {target}!", "You yeeted yourself?"],
};

type ReactionName = keyof typeof REACTION_MESSAGES;

@ApplyOptions<SubcommandOptions>({
  description: "Reaction commands.",
  ...standardCommandOptions,
  subcommands: Object.keys(REACTION_MESSAGES).map(name => ({
    name,
    chatInputRun: "subcommandDefault",
  })),
})
export class ReactionCommand extends Subcommand {
  public override registerApplicationCommands(registry: Subcommand.Registry) {
    registry.registerChatInputCommand(builder =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .setIntegrationTypes([ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall])
        .setContexts([InteractionContextType.Guild, InteractionContextType.PrivateChannel])
        .addSubcommand(cmd =>
          cmd
            .setName("bite")
            .setDescription("Chomp!")
            .addUserOption(option => option.setName("user").setDescription("User receiving the reaction."))
        )
        .addSubcommand(cmd => cmd.setName("blush").setDescription("..."))
        .addSubcommand(cmd => cmd.setName("bored").setDescription("Nothing to do..."))
        .addSubcommand(cmd =>
          cmd
            .setName("cuddle")
            .setDescription("Cuddle with someone!")
            .addUserOption(option => option.setName("user").setDescription("User receiving the reaction."))
        )
        .addSubcommand(cmd =>
          cmd
            .setName("handhold")
            .setDescription("Hold someone's hand.")
            .addUserOption(option => option.setName("user").setDescription("User receiving the reaction."))
        )
        .addSubcommand(cmd =>
          cmd
            .setName("highfive")
            .setDescription("Highfive someone!")
            .addUserOption(option => option.setName("user").setDescription("User receiving the reaction."))
        )
        .addSubcommand(cmd =>
          cmd
            .setName("hug")
            .setDescription("Give someone a warm hug!")
            .addUserOption(option => option.setName("user").setDescription("User receiving the reaction."))
        )
        .addSubcommand(cmd =>
          cmd
            .setName("kick")
            .setDescription("Kick someone!")
            .addUserOption(option => option.setName("user").setDescription("User receiving the reaction."))
        )
        .addSubcommand(cmd =>
          cmd
            .setName("kiss")
            .setDescription("Kiss someone!")
            .addUserOption(option => option.setName("user").setDescription("User receiving the reaction."))
        )
        .addSubcommand(cmd =>
          cmd
            .setName("nod")
            .setDescription("AgreeAgreeAgreeAgree")
            .addUserOption(option => option.setName("user").setDescription("User receiving the reaction."))
        )
        .addSubcommand(cmd =>
          cmd
            .setName("pat")
            .setDescription("There there...")
            .addUserOption(option => option.setName("user").setDescription("User receiving the reaction."))
        )
        .addSubcommand(cmd =>
          cmd
            .setName("poke")
            .setDescription("Don't poke at the bear")
            .addUserOption(option => option.setName("user").setDescription("User receiving the reaction."))
        )
        .addSubcommand(cmd =>
          cmd
            .setName("punch")
            .setDescription("Punth thomeone inth the fathe")
            .addUserOption(option => option.setName("user").setDescription("User receiving the reaction."))
        )
        .addSubcommand(cmd =>
          cmd
            .setName("slap")
            .setDescription("Will Smith")
            .addUserOption(option => option.setName("user").setDescription("User receiving the reaction."))
        )
        .addSubcommand(cmd =>
          cmd
            .setName("sleep")
            .setDescription("The average day of Shinano")
            .addUserOption(option => option.setName("user").setDescription("User receiving the reaction."))
        )
        .addSubcommand(cmd =>
          cmd
            .setName("stare")
            .setDescription("👀")
            .addUserOption(option => option.setName("user").setDescription("User receiving the reaction."))
        )
        .addSubcommand(cmd =>
          cmd
            .setName("think")
            .setDescription("🤔")
            .addUserOption(option => option.setName("user").setDescription("User receiving the reaction."))
        )
        .addSubcommand(cmd =>
          cmd
            .setName("tickle")
            .setDescription("Tickle someone")
            .addUserOption(option => option.setName("user").setDescription("User receiving the reaction."))
        )
        .addSubcommand(cmd =>
          cmd
            .setName("yeet")
            .setDescription("Absolutely yeet someone!")
            .addUserOption(option => option.setName("user").setDescription("User receiving the reaction."))
        )
    );
  }

  public async subcommandDefault(interaction: Subcommand.ChatInputCommandInteraction) {
    if (!interaction.deferred) await interaction.deferReply();

    const user = interaction.options.getUser("user");
    const reaction = interaction.options.getSubcommand() as ReactionName;

    try {
      const description = this.getDescription(reaction, user, interaction.user);
      const imageLink = await this.getReactionImageLink(reaction);

      const reactionEmbed = new EmbedBuilder().setColor("Random").setDescription(description).setImage(imageLink);

      await interaction.editReply({ embeds: [reactionEmbed] });
    } catch (error) {
      const errorEmbed = new EmbedBuilder()
        .setColor("Red")
        .setDescription("❌ | Failed to fetch reaction. Please try again later.");
      await interaction.editReply({ embeds: [errorEmbed] });
      throw error;
    }
  }

  private getDescription(reaction: ReactionName, target: User | null, user: User): string {
    const messages = REACTION_MESSAGES[reaction];
    // If target provided use first template, otherwise use fallback (or first if no fallback)
    const template = target ? messages[0] : (messages[1] ?? messages[0]);

    return template.replace("{user}", user.toString()).replace("{target}", target?.toString() ?? "");
  }

  private async getReactionImageLink(reaction: string): Promise<string> {
    const data = await fetchJson<NekosBestResponse>(`https://nekos.best/api/v2/${reaction}`);
    return data.results[0].url;
  }
}
