import { ExtensionContext } from "vscode";
import { registerOnDidChangeDiagnostics } from "./diagnostics";
import { logger } from "./logger";
import { registerCopyError } from "./commands/copyError";
import { registerRevealSelection } from "./commands/revealSelection";
import { registerOpenMarkdownPreview } from "./commands/openMarkdownPreview";
import { registerSelectedTextHoverProvider } from "./provider/selectedTextHoverProvider";
import { registerTextDocumentProvider } from "./provider/textDocumentContentProvider";
import { registerWebviewViewProvider } from "./provider/webviewViewProvider";

export function activate(context: ExtensionContext) {
  // logging and debug features
  logger.info("activating");
  context.subscriptions.push(logger);
  registerSelectedTextHoverProvider(context);

  // prettify diagnostics feature
  registerOnDidChangeDiagnostics(context);

  // UI elements that show the prettified diagnostics
  registerTextDocumentProvider(context);
  registerWebviewViewProvider(context);

  // register commands
  registerCopyError(context);
  registerOpenMarkdownPreview(context);
  registerRevealSelection(context);
}

export function deactivate() {
  logger.info("deactivating");
}
