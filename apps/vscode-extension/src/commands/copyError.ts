import { commands, env, l10n, window, type ExtensionContext } from "vscode";
import { execute } from "./execute";

const COMMAND_ID = "prettyTsErrors.copyError";

export function registerCopyError(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand(COMMAND_ID, async (errorMessage: unknown) =>
      execute(COMMAND_ID, async () => {
        if (typeof errorMessage !== "string") {
          throw new Error("cannot write non-string value to clipboard", {
            cause: errorMessage,
          });
        }
        await env.clipboard.writeText(errorMessage);
        window.showInformationMessage(
          l10n.t("Copied error message to clipboard!")
        );
      })
    )
  );
}
