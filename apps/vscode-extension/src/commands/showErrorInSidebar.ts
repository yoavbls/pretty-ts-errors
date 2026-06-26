import { commands, type ExtensionContext } from "vscode";
import { execute } from "./execute";
import { tryEnsureRange, tryEnsureUri } from "./validate";
import { getViewProvider } from "../provider/webviewViewProvider";
import { logger } from "../logger";

const COMMAND_ID = "prettyTsErrors.showErrorInSidebar";

export function registerShowErrorInSidebar(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand(
      COMMAND_ID,
      async (
        maybeUriOrRangeLike?: unknown,
        maybeRangeOrMessage?: unknown,
        maybeMessage?: unknown,
      ) =>
        execute(COMMAND_ID, async () => {
          const uriResult = tryEnsureUri(maybeUriOrRangeLike);
          const explicitRangeResult = tryEnsureRange(maybeRangeOrMessage);
          const fallbackRangeResult = tryEnsureRange(maybeUriOrRangeLike);

          const explicitMessage =
            typeof maybeMessage === "string" ? maybeMessage : undefined;
          const fallbackMessage =
            typeof maybeRangeOrMessage === "string"
              ? maybeRangeOrMessage
              : undefined;

          const viewProvider = getViewProvider();

          if (uriResult.isValidUri && explicitRangeResult.isValidRange) {
            logger.debug(
              `showing diagnostic in sidebar for ${uriResult.uri.toString(true)} at ${explicitRangeResult.range.start.line}:${explicitRangeResult.range.start.character}`
            );
            await viewProvider?.lockToDiagnostic(
              uriResult.uri,
              explicitRangeResult.range,
              explicitMessage,
            );
          } else if (fallbackRangeResult.isValidRange) {
            logger.warn(
              "showErrorInSidebar was invoked without a document uri; falling back to the active editor."
            );
            await viewProvider?.lockToDiagnostic(
              undefined,
              fallbackRangeResult.range,
              fallbackMessage,
            );
          } else {
            logger.warn(
              "showErrorInSidebar received no valid diagnostic target arguments."
            );
          }

          try {
            await commands.executeCommand("workbench.view.extension.prettyTsErrors");
          } catch (error) {
            logger.warn("failed to open the prettyTsErrors view container", error);
          }

          try {
            await commands.executeCommand("prettyTsErrors.sidePanel.focus");
          } catch (error) {
            logger.warn("failed to focus the prettyTsErrors side panel", error);
          }
        })
    )
  );
}
