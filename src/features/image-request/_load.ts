import { loadPieces } from "../../core/virtualPieces";
import { CatCommand } from "./commands/cat";
import { CatgirlCommand } from "./commands/catgirl";
import { DogCommand } from "./commands/dog";
import { FoxCommand } from "./commands/fox";
import { FoxgirlCommand } from "./commands/foxgirl";
import { HusbandoCommand } from "./commands/husbando";
import { PandaCommand } from "./commands/panda";
import { WaifuCommand } from "./commands/waifu";
import { MakeQuoteContextMenuCommand, MakeQuoteContextMenuListener } from "./context-menu/makeQuote";

loadPieces("commands", [
  { piece: CatCommand, name: "cat" },
  { piece: CatgirlCommand, name: "catgirl" },
  { piece: DogCommand, name: "dog" },
  { piece: FoxCommand, name: "fox" },
  { piece: FoxgirlCommand, name: "foxgirl" },
  { piece: HusbandoCommand, name: "husbando" },
  { piece: WaifuCommand, name: "waifu" },
  { piece: MakeQuoteContextMenuCommand, name: "makeQuote" },
  { piece: PandaCommand, name: "panda" },
]);

loadPieces("listeners", [{ piece: MakeQuoteContextMenuListener, name: "makeQuoteListener" }]);
