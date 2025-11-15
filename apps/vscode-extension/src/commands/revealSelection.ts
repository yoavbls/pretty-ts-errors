import {
  type ExtensionContext,
  commands,
  Range,
  Selection,
  TabInputText,
  TabInputWebview,
  TextEditorRevealType,
  Uri,
  ViewColumn,
  window,
  workspace,
} from "vscode";
import { MarkdownWebviewProvider } from "../provider/markdownWebviewProvider";

export function registerRevealSelection(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand(
      "prettyTsErrors.revealSelection",
      async (uri: Uri, range: Range) => {
        // ensure these are real instances
        uri = Uri.from({ ...uri });
        range = new Range(
          range.start.line,
          range.start.character,
          range.end.line,
          range.end.character
        );

        // default behaviour is to use the active view column
        let viewColumn = ViewColumn.Active;

        // detect if the active tab is our preview webview
        let isFromMarkdownPreviewWebview = false;
        const activeTab = window.tabGroups.activeTabGroup.activeTab;
        if (activeTab && activeTab.input instanceof TabInputWebview) {
          // For an unknown reason this string is prefixed with something like `mainthread-${viewType}`
          // endsWith should handle a full match and the prefixed versions
          if (
            activeTab.input.viewType.endsWith(MarkdownWebviewProvider.viewType)
          ) {
            isFromMarkdownPreviewWebview = true;
          }
        }

        if (isFromMarkdownPreviewWebview) {
          // find a tab group where the file is open, then use that view column for the `vscode.open` command
          const tabs = window.tabGroups.all.flatMap(
            (tabGroup) => tabGroup.tabs
          );
          const tabWithFileOpen = tabs.find((tab) => {
            if (tab.input instanceof TabInputText) {
              return tab.input.uri.toString() === uri.toString();
            }
            return false;
          });
          if (tabWithFileOpen) {
            viewColumn = tabWithFileOpen.group.viewColumn;
          } else {
            // If markdown preview is not open on 1, open the link in 1, else open the link in 2
            viewColumn =
              activeTab!.group.viewColumn !== 1
                ? ViewColumn.One
                : ViewColumn.Two;
          }
        }

        return commands.executeCommand("vscode.open", uri, {
          selection: range,
          viewColumn,
        });
      }
    )
  );
}
