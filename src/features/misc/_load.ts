import { loadPieces } from "../../core/virtualPieces";
import { AvatarCommand } from "./commands/avatar";
import { BannerCommand } from "./commands/banner";
import { DeveloperCommand } from "./commands/developer";
import { ShinanoCommand } from "./commands/shinano";

loadPieces("commands", [
  { piece: AvatarCommand, name: "avatar" },
  { piece: BannerCommand, name: "banner" },
  { piece: ShinanoCommand, name: "shinano" },
  { piece: DeveloperCommand, name: "developer" },
]);
