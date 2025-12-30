import type { ExtensionContext } from "vscode";
import { commands } from "vscode";
import { MarkdownWebviewProvider } from "../provider/markdownWebviewProvider";
import { tryEnsureUri } from "./validate";
import { execute } from "./execute";

const COMMAND_ID = "prettyTsErrors.openMarkdownPreview";

export function registerOpenMarkdownPreview(context: ExtensionContext) {
  const provider = new MarkdownWebviewProvider(context);
  context.subscriptions.push(
    commands.registerCommand(COMMAND_ID, async (maybeUriLike: unknown) =>
      execute(COMMAND_ID, async () => {
        const { isValidUri, uri } = tryEnsureUri(maybeUriLike);
        if (!isValidUri) {
          throw new Error("cannot open markdown preview with an invalid uri", {
            cause: maybeUriLike,
          });
        }
        await provider.openMarkdownPreview(uri);
      })
    )
  );
}
