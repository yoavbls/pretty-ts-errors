import { type ExtensionContext, commands } from "vscode";
import { tryEnsureRange, tryEnsureUri } from "./validate";
import { execute } from "./execute";

const COMMAND_ID = "prettyTsErrors.revealSelection";

export function registerRevealSelection(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand(
      COMMAND_ID,
      async (maybeUriLike: unknown, maybeRangeLike: unknown) =>
        execute(COMMAND_ID, async () => {
          const { isValidUri, uri } = tryEnsureUri(maybeUriLike);
          const { isValidRange, range } = tryEnsureRange(maybeRangeLike);
          if (!isValidUri || !isValidRange) {
            throw new Error(
              "cannot reveal selection with invalid range or uri",
              {
                cause: {
                  range: maybeRangeLike,
                  uri: maybeUriLike,
                },
              }
            );
          }
          return commands.executeCommand("vscode.open", uri, {
            selection: range,
          });
        })
    )
  );
}
