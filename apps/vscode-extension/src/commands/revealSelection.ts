import {
  type ExtensionContext,
  type Tab,
  commands,
  Range,
  TabInputText,
  TabInputWebview,
  Uri,
  ViewColumn,
  window,
} from "vscode";
import { MarkdownWebviewProvider } from "../provider/markdownWebviewProvider";
import { logger } from "../logger";

export function registerRevealSelection(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand(
      "prettyTsErrors.revealSelection",
      async (maybeUriLike: unknown, maybeRangeLike: unknown) => {
        const { isValidUri, uri } = tryEnsureUri(maybeUriLike);
        const { isValidRange, range } = tryEnsureRange(maybeRangeLike);
        if (!isValidUri || !isValidRange) {
          logger.error(
            "cannot reveal selection with invalid range or uri",
            maybeRangeLike,
            maybeUriLike
          );
          return;
        }
        const viewColumn = determineViewColumn(uri);
        return commands.executeCommand("vscode.open", uri, {
          selection: range,
          viewColumn,
        });
      }
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

function tryEnsureUri(
  maybeUriLike: unknown
): { isValidUri: true; uri: Uri } | { isValidUri: false; uri?: undefined } {
  if (maybeUriLike instanceof Uri) {
    return { isValidUri: true, uri: maybeUriLike };
  }
  if (typeof maybeUriLike === "string") {
    try {
      return { isValidUri: true, uri: Uri.parse(maybeUriLike) };
    } catch (error) {
      return { isValidUri: false };
    }
  }
  if (isUriLike(maybeUriLike)) {
    return { isValidUri: true, uri: Uri.from(maybeUriLike) };
  }
  return { isValidUri: false };
}

type UriLike = Parameters<typeof Uri.from>[0];

function isUriLike(value: unknown): value is UriLike {
  return (
    typeof value === "object" &&
    value != null &&
    "scheme" in value &&
    typeof value.scheme === "string"
  );
}

function tryEnsureRange(
  maybeRangeLike: unknown
):
  | { isValidRange: true; range: Range }
  | { isValidRange: false; range?: undefined } {
  if (maybeRangeLike instanceof Range) {
    return { isValidRange: true, range: maybeRangeLike };
  }
  if (isRangeLike(maybeRangeLike)) {
    return {
      isValidRange: true,
      range: new Range(
        maybeRangeLike.start.line,
        maybeRangeLike.start.character,
        maybeRangeLike.end.line,
        maybeRangeLike.end.character
      ),
    };
  }
  return { isValidRange: false };
}

type RangeLike = { start: PositionLike; end: PositionLike };

function isRangeLike(value: unknown): value is RangeLike {
  return (
    typeof value === "object" &&
    value != null &&
    "start" in value &&
    isPositionLike(value.start) &&
    "end" in value &&
    isPositionLike(value.end)
  );
}

type PositionLike = { line: number; character: number };

function isPositionLike(value: unknown): value is PositionLike {
  return (
    typeof value === "object" &&
    value !== null &&
    "line" in value &&
    typeof value.line === "number" &&
    "character" in value &&
    typeof value.character === "number"
  );
}
