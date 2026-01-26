import {
  type ExtensionContext,
  type Tab,
  commands,
  TabInputText,
  TabInputWebview,
  Uri,
  ViewColumn,
  window,
} from "vscode";
import { MarkdownWebviewProvider } from "../provider/markdownWebviewProvider";
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
          const viewColumn = determineViewColumn(uri);
          return commands.executeCommand("vscode.open", uri, {
            selection: range,
            viewColumn,
          });
        })
    )
  );
}

/**
 * Determine the view column to use for the `vscode.open` command:
 * - if the command is not called from a markdown webview preview, default to `ViewColumn.Active`, which will defer the decision to VS Code
 * - else check if the file is open somewhere and use its view column
 * - else use the opposite of where the preview resides (left if the preview is right, right if the preview is left)
 *
 * This seems a bit complex, but without it VS Code will open a new view column to the right and open the given uri in it, regardless of the current layout and open files.
 * Using this algorithm makes it feel more intuitive and less stupid.
 */
function determineViewColumn(uri: Uri): ViewColumn {
  if (!isFromMarkdownPreviewWebview()) {
    return ViewColumn.Active;
  }
  const tab = findTabWithFileOpen(uri);
  if (tab) {
    return tab.group.viewColumn;
  }
  // If markdown preview is not open on 1, open the link in 1, else open the link in 2
  const activeTab = window.tabGroups.activeTabGroup.activeTab;
  return activeTab!.group.viewColumn !== 1 ? ViewColumn.One : ViewColumn.Two;
}

/**
 * Search for an open tab with the given `uri` and return it if it exists
 */
function findTabWithFileOpen(uri: Uri): Tab | undefined {
  const tabs = window.tabGroups.all.flatMap((tabGroup) => tabGroup.tabs);
  return tabs.find((tab) => {
    if (tab.input instanceof TabInputText) {
      return tab.input.uri.toString() === uri.toString();
    }
    return false;
  });
}

/**
 * Returns `true` if the active tab is a pretty-ts-errors markdown preview webview
 */
function isFromMarkdownPreviewWebview(): boolean {
  const activeTab = window.tabGroups.activeTabGroup.activeTab;
  if (activeTab && activeTab.input instanceof TabInputWebview) {
    // For an unknown reason this string is prefixed with something like `mainthread-${viewType}`
    // endsWith should handle a full match and the prefixed versions
    if (activeTab.input.viewType.endsWith(MarkdownWebviewProvider.viewType)) {
      return true;
    }
  }
  return false;
}
