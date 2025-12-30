import { ExtensionContext } from "vscode";
import { registerSelectedTextHoverProvider } from "./provider/selectedTextHoverProvider";
import { registerOnDidChangeDiagnostics } from "./diagnostics";
import { logger } from "./logger";
import { registerTextDocumentProvider } from "./provider/textDocumentContentProvider";
import { registerMarkdownWebviewProvider } from "./provider/markdownWebviewProvider";
import { registerWebviewViewProvider } from "./provider/webviewViewProvider";
import { registerRevealSelection } from "./commands/revealSelection";
import { registerCopyError } from "./commands/copyError";

export function activate(context: ExtensionContext) {
  // logging and debug features
  logger.info("activating");
  context.subscriptions.push(logger);
  registerSelectedTextHoverProvider(context);

  // prettify diagnostics feature
  registerOnDidChangeDiagnostics(context);

  // UI elements that show the prettified diagnostics
  registerTextDocumentProvider(context);
  registerMarkdownWebviewProvider(context);
  registerWebviewViewProvider(context);

  // register commands
  registerRevealSelection(context);
  registerCopyError(context);
}

export function deactivate() {
  logger.info("deactivating");
}
