import type { ExtensionContext } from "vscode";
import { commands } from "vscode";
import { MarkdownWebviewProvider } from "../provider/markdownWebviewProvider";
import { tryEnsureUri } from "./validate";
import { logger } from "../logger";

export function registerOpenMarkdownPreview(context: ExtensionContext) {
  const provider = new MarkdownWebviewProvider(context);
  context.subscriptions.push(
    commands.registerCommand(
      "prettyTsErrors.openMarkdownPreview",
      async (maybeUriLike: unknown) => {
        const { isValidUri, uri } = tryEnsureUri(maybeUriLike);
        if (!isValidUri) {
          logger.error(
            "cannot open markdown preview with an invalid uri",
            maybeUriLike
          );
          return;
        }
        await provider.openMarkdownPreview(uri);
      }
    )
  );
}
