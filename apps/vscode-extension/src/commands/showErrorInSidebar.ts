import { commands, type ExtensionContext } from "vscode";
import { execute } from "./execute";
import { tryEnsureRange } from "./validate";
import { getViewProvider } from "../provider/webviewViewProvider";

const COMMAND_ID = "prettyTsErrors.showErrorInSidebar";

export function registerShowErrorInSidebar(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand(
      COMMAND_ID,
      async (maybeRangeLike?: unknown, maybeMessage?: unknown) =>
        execute(COMMAND_ID, async () => {
          if (maybeRangeLike !== undefined) {
            const { isValidRange, range } = tryEnsureRange(maybeRangeLike);
            const message =
              typeof maybeMessage === "string" ? maybeMessage : undefined;
            const viewProvider = getViewProvider();
            if (isValidRange && viewProvider) {
              await viewProvider.lockToDiagnostic(range, message);
            }
          }

          try {
            await commands.executeCommand(
              "workbench.view.extension.prettyTsErrors"
            );
          } catch {}
        })
    )
  );
}
