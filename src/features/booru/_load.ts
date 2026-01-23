import { loadPieces } from "../../core/virtualPieces";
import { AnalCommand } from "./commands/anal";
import { AutobooruCommand } from "./commands/autobooru";
import { BukkakeCommand } from "./commands/bukkake";
import { CreampieCommand } from "./commands/creampie";
import { FemboyCommand } from "./commands/femboy";
import { FemdomCommand } from "./commands/femdom";
import { FootjobCommand } from "./commands/footjob";
import { GelbooruCommand } from "./commands/gelbooru";
import { NeferpitouCommand } from "./commands/neferpitou";
import { PaizuriCommand } from "./commands/paizuri";
import { Rule34Command } from "./commands/rule34";
import { SafebooruCommand } from "./commands/safebooru";
import { ThighjobCommand } from "./commands/thighjob";
import { TomboyCommand } from "./commands/tomboy";
import { UmaCommand } from "./commands/uma";
import { VocaloidCommand } from "./commands/vocaloid";
import { VtuberCommand } from "./commands/vtuber";
import { YaoiCommand } from "./commands/yaoi";
import { YuriCommand } from "./commands/yuri";
import { GelbooruAutocompleteHandler } from "./interaction-handlers/autocomplete/gelbooru";
import { Rule34AutocompleteHandler } from "./interaction-handlers/autocomplete/rule34";
import { SafebooruAutocompleteHandler } from "./interaction-handlers/autocomplete/safebooru";

loadPieces("commands", [
  { piece: GelbooruCommand, name: "gelbooru" },
  { piece: Rule34Command, name: "rule34" },
  { piece: SafebooruCommand, name: "safebooru" },
  { piece: NeferpitouCommand, name: "neferpitou" },
  { piece: UmaCommand, name: "uma" },
  { piece: VocaloidCommand, name: "vocaloid" },

  { piece: AnalCommand, name: "anal" },
  { piece: BukkakeCommand, name: "bukkake" },
  { piece: CreampieCommand, name: "creampie" },
  { piece: FemboyCommand, name: "femboy" },
  { piece: FemdomCommand, name: "femdom" },
  { piece: FootjobCommand, name: "footjob" },
  { piece: PaizuriCommand, name: "paizuri" },
  { piece: ThighjobCommand, name: "thighjob" },
  { piece: TomboyCommand, name: "tomboy" },
  { piece: VtuberCommand, name: "vtuber" },
  { piece: YaoiCommand, name: "yaoi" },
  { piece: YuriCommand, name: "yuri" },
  { piece: AutobooruCommand, name: "autobooru" },
]);

loadPieces("interaction-handlers", [
  { piece: GelbooruAutocompleteHandler, name: "gelbooruAutocomplete" },
  { piece: Rule34AutocompleteHandler, name: "rule34Autocomplete" },
  { piece: SafebooruAutocompleteHandler, name: "safebooruAutocomplete" },
]);
