import { loadPieces } from "../../core/virtualPieces";
import { AutolewdCommand } from "./commands/autolewd";
import { MeteorCommand } from "./commands/meteor";
import { PrivateCommand } from "./commands/private";

loadPieces("commands", [
  { piece: MeteorCommand, name: "meteor" },
  { piece: PrivateCommand, name: "private" },
  { piece: AutolewdCommand, name: "autolewd" },
]);
