import { commands, type ExtensionContext } from "vscode";
import { execute } from "./execute";
import { tryEnsureRange } from "./validate";
import { getViewProvider } from "../provider/webviewViewProvider";

const COMMAND_ID = "prettyTsErrors.pinError";

export function registerPinError(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand(
      COMMAND_ID,
      async (maybeRangeLike: unknown, maybeMessage?: unknown) =>
        execute(COMMAND_ID, async () => {
          const { isValidRange, range } = tryEnsureRange(maybeRangeLike);
          if (!isValidRange) {
            throw new Error("cannot pin error with an invalid range", {
              cause: maybeRangeLike,
            });
          }
          const message =
            typeof maybeMessage === "string" ? maybeMessage : undefined;

          const viewProvider = getViewProvider();
          await viewProvider?.pinDiagnostic(range, message);

          try {
            await commands.executeCommand("prettyTsErrors.sidePanel.focus");
          } catch {}
        })
    )
  );
}
