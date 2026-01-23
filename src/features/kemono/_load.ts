import { loadPieces } from "../../core/virtualPieces";
import { KemonoCommand } from "./commands/kemono";
import { KemonoCreatorAutocompleteHandler } from "./interaction-handlers/autocomplete/kemono-creator";

loadPieces("commands", [{ piece: KemonoCommand, name: "kemono" }]);

loadPieces("interaction-handlers", [{ piece: KemonoCreatorAutocompleteHandler, name: "kemono-creator" }]);
