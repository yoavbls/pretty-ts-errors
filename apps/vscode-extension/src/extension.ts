import { ExtensionContext } from "vscode";
import { registerSelectedTextHoverProvider } from "./provider/selectedTextHoverProvider";
import { registerOnDidChangeDiagnostics } from "./diagnostics";
import { logger } from "./logger";

export function activate(context: ExtensionContext) {
  logger.info("activating");
  context.subscriptions.push(logger);
  registerSelectedTextHoverProvider(context);
  registerOnDidChangeDiagnostics(context);
}

export function deactivate() {
  logger.info("deactivating");
}
