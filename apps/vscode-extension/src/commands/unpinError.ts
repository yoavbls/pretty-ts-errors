import { commands, type ExtensionContext } from "vscode";
import { execute } from "./execute";
import { getViewProvider } from "../provider/webviewViewProvider";

const COMMAND_ID = "prettyTsErrors.unpinError";

export function registerUnpinError(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand(COMMAND_ID, async () =>
      execute(COMMAND_ID, async () => {
        const viewProvider = getViewProvider();
        viewProvider?.unpinDiagnostic();
      })
    )
  );
}
