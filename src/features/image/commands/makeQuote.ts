import { ApplyOptions } from "@sapphire/decorators";
import { Command, type CommandOptions } from "@sapphire/framework";
import { ApplicationCommandType, ApplicationIntegrationType, InteractionContextType } from "discord.js";

@ApplyOptions<CommandOptions>({
  description: "Turn an user message into a quote",
  preconditions: ["NotBlacklisted"],
})
export class MakeQuoteContextMenuCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerContextMenuCommand(builder =>
      builder
        .setName("Make this a quote!")
        .setType(ApplicationCommandType.Message)
        .setIntegrationTypes([ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall])
        .setContexts([InteractionContextType.Guild, InteractionContextType.PrivateChannel])
    );
  }
}
