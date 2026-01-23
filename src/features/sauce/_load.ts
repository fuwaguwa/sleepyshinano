import { loadPieces } from "../../core/virtualPieces";
import { SauceCommand } from "./commands/sauce";
import { GetSauceButtonHandler } from "./interaction-handlers/buttons/getSauce";

loadPieces("commands", [{ piece: SauceCommand, name: "sauce" }]);

loadPieces("interaction-handlers", [{ piece: GetSauceButtonHandler, name: "getSauce" }]);
