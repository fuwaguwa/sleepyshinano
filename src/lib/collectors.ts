import { Collection, type InteractionCollector } from "discord.js";

export const buttonCollector: Collection<string, InteractionCollector<any>> = new Collection();
export const paginationCollector: Collection<string, InteractionCollector<any>> = new Collection();
