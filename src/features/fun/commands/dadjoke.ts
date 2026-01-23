import { ApplyOptions } from "@sapphire/decorators";
import { Command, type CommandOptions } from "@sapphire/framework";
import { type ChatInputCommandInteraction, ContainerBuilder, MessageFlags, TextDisplayBuilder } from "discord.js";
import { fetchJson } from "../../../shared/lib/http";
import type { DadJokeResponse } from "../types/API";

const DAD_JOKE_API = "https://icanhazdadjoke.com/";

@ApplyOptions<CommandOptions>({
  description: "Make a dadjoke",
  preconditions: ["NotBlacklisted"],
})
export class DadjokeCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(builder => builder.setName(this.name).setDescription(this.description));
  }

  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    if (!interaction.deferred) await interaction.deferReply();

    try {
      const dadjoke = await fetchJson<DadJokeResponse>(DAD_JOKE_API, {
        headers: { Accept: "application/json" },
      });

      if (!dadjoke || !dadjoke.joke) throw new Error("Cannot find dadjoke");

      const joke = dadjoke.joke;
      const jokeText = new TextDisplayBuilder().setContent(joke);
      const containerComponent = new ContainerBuilder().addTextDisplayComponents(jokeText);

      await interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: [containerComponent] });
    } catch (error) {
      const errorText = new TextDisplayBuilder().setContent("❌️ Failed to fetch a dadjoke!");
      const containerComponent = new ContainerBuilder().addTextDisplayComponents(errorText).setAccentColor([255, 0, 0]);

      await interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: [containerComponent] });
      throw error;
    }
  }
}
