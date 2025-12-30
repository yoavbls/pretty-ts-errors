import { commands, env, window, type ExtensionContext } from "vscode";

export function registerCopyError(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand(
      "prettyTsErrors.copyError",
      async (errorMessage: string) => {
        await env.clipboard.writeText(errorMessage);
        window.showInformationMessage("Copied error message to clipboard!");
      }
    )
  );
}
