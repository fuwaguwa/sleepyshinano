import { BlacklistedErrorCommandListener } from "./listeners/commands/blacklisted";
import { CooldownErrorCommandListener } from "./listeners/commands/cooldownError";
import { NotInMainServerErrorCommandListener } from "./listeners/commands/notInMainServerError";
import { CollectorRefreshCommandListener } from "./listeners/commands/refreshCollectors";
import { ChatInputCommandSuccessListener } from "./listeners/commands/success";
import { ReadyListener } from "./listeners/ready";
import { MissingClientPermissionSubcommandListener } from "./listeners/subcommands/missingClientPermission";
import { MissingUserPermissionSubcommandListener } from "./listeners/subcommands/missingUserPermission";
import { NotInMainServerErrorSubcommandListener } from "./listeners/subcommands/notInMainServerError";
import { ChatInputSubcommandSuccessListener } from "./listeners/subcommands/success";
import { InMainServerPrecondition } from "./preconditions/InMainServer";
import { NotBlacklistedPrecondition } from "./preconditions/NotBlacklisted";
import { OwnerOnlyPrecondition } from "./preconditions/OwnerOnly";
import { loadPieces } from "./virtualPieces";

loadPieces("listeners", [
  { piece: BlacklistedErrorCommandListener, name: "blacklisted" },
  { piece: CooldownErrorCommandListener, name: "chatInputCommandDenied" },
  { piece: NotInMainServerErrorCommandListener, name: "chatInputCommandDenied" },
  { piece: CollectorRefreshCommandListener, name: "chatInputCommandRun" },
  { piece: ChatInputCommandSuccessListener, name: "chatInputCommandSuccess" },
  { piece: ReadyListener, name: "ready" },
  { piece: MissingClientPermissionSubcommandListener, name: "chatInputSubcommandDenied" },
  { piece: MissingUserPermissionSubcommandListener, name: "chatInputCommandDenied" },
  { piece: NotInMainServerErrorSubcommandListener, name: "chatInputSubcommandDenied" },
  { piece: ChatInputSubcommandSuccessListener, name: "chatInputSubcommandSuccess" },
]);

loadPieces("preconditions", [
  { piece: InMainServerPrecondition, name: "InMainServer" },
  { piece: NotBlacklistedPrecondition, name: "NotBlacklisted" },
  { piece: OwnerOnlyPrecondition, name: "OwnerOnly" },
]);
