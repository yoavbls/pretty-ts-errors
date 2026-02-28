import { ExtensionContext, commands } from "vscode";
import { registerOnDidChangeDiagnostics } from "./diagnostics";
import { logger } from "./logger";
import { registerCopyError } from "./commands/copyError";
import { registerRevealSelection } from "./commands/revealSelection";
import { registerShowErrorInSidebar } from "./commands/showErrorInSidebar";
import { registerPinError } from "./commands/pinError";
import { registerUnpinError } from "./commands/unpinError";
import { registerSelectedTextHoverProvider } from "./provider/selectedTextHoverProvider";
import { registerWebviewViewProvider } from "./provider/webviewViewProvider";
import { SUPPORTED_LANGUAGE_IDS } from "./supportedLanguageIds";

export function activate(context: ExtensionContext) {
  logger.info("activating");

  void commands.executeCommand(
    "setContext",
    "prettyTsErrors.supportedLanguageIds",
    SUPPORTED_LANGUAGE_IDS
  );

  // logging and debug features
  logger.register(context);
  registerSelectedTextHoverProvider(context);

  // prettify diagnostics feature
  registerOnDidChangeDiagnostics(context);

  // UI elements that show the prettified diagnostics
  registerWebviewViewProvider(context);

  // register commands
  registerCopyError(context);
  registerShowErrorInSidebar(context);
  registerPinError(context);
  registerUnpinError(context);
  registerRevealSelection(context);
}

export function deactivate() {
  logger.info("deactivating");
}
