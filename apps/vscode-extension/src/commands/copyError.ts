import { commands, env, window, type ExtensionContext } from "vscode";
import { logger } from "../logger";

export function registerCopyError(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand(
      "prettyTsErrors.copyError",
      async (errorMessage: unknown) => {
        if (typeof errorMessage !== "string") {
          logger.error(
            "cannot write non-string value to clipboard",
            errorMessage
          );
          return;
        }
        await env.clipboard.writeText(errorMessage);
        window.showInformationMessage("Copied error message to clipboard!");
      }
    )
  );
}
