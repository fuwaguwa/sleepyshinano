import { loadPieces } from "../../core/virtualPieces";
import { VoteCheckButtonHandler } from "./interaction-handlers/buttons/voteCheck";
import { VotedPrecondition } from "./preconditions/Voted";

loadPieces("preconditions", [{ piece: VotedPrecondition, name: "Voted" }]);
loadPieces("interaction-handlers", [{ piece: VoteCheckButtonHandler, name: "voteCheck" }]);
