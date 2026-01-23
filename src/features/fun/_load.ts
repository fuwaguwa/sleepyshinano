import { loadPieces } from "../../core/virtualPieces";
import { EightBallCommand } from "./commands/8ball";
import { DadjokeCommand } from "./commands/dadjoke";
import { DefineCommand } from "./commands/define";
import { MatchCommand } from "./commands/match";
import { OwoifyCommand } from "./commands/owoify";
import { ReactionCommand } from "./commands/reaction";
import { TriviaCommand } from "./commands/trivia";

loadPieces("commands", [
  { piece: EightBallCommand, name: "8ball" },
  { piece: DadjokeCommand, name: "dadjoke" },
  { piece: DefineCommand, name: "define" },
  { piece: MatchCommand, name: "match" },
  { piece: OwoifyCommand, name: "owoify" },
  { piece: ReactionCommand, name: "reaction" },
  { piece: TriviaCommand, name: "trivia" },
]);
