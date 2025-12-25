import { Collection, InteractionCollector } from "discord.js";

declare module "@sapphire/pieces" {
  interface Container {
    buttonCollector: Collection<string, InteractionCollector<any>>;
    paginationCollector: Collection<string, InteractionCollector<any>>;
  }
}

declare module "@sapphire/framework" {
  interface Preconditions {
    OwnerOnly: never;
    Voted: never;
    NotBlacklisted: never;
    InMainServer: never;
  }
}