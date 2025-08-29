import { d } from "@pretty-ts-errors/utils";
import { formatDiagnostic } from "@pretty-ts-errors/vscode-formatter";
import {
  ExtensionContext,
  ExtensionMode,
  MarkdownString,
  languages,
  window,
} from "vscode";
import { createConverter } from "vscode-languageclient/lib/common/codeConverter";

/**
 * Register an hover provider in debug only.
 * It format selected text and help test things visually easier.
 */
export function registerSelectedTextHoverProvider(context: ExtensionContext) {
  const converter = createConverter();

  if (context.extensionMode !== ExtensionMode.Development) {
    return;
  }

  context.subscriptions.push(
    languages.registerHoverProvider(
      {
        language: "typescript",
        pattern: "**/test/**/*.ts",
      },
      {
        provideHover(document, position) {
          const editor = window.activeTextEditor;
          const range = document.getWordRangeAtPosition(position);
          const message = editor ? document.getText(editor.selection) : "";

          if (!range || !message) {
            return null;
          }

          const markdown = new MarkdownString(
            debugHoverHeader +
              formatDiagnostic(
                converter.asDiagnostic({
                  message,
                  range,
                  severity: 0,
                  source: "ts",
                  code: 1337,
                })
              )
          );

          markdown.isTrusted = true;
          markdown.supportHtml = true;

          return {
            contents: [markdown],
          };
        },
      }
    )
  );
}

const debugHoverHeader = d/*html*/ `                        
  <span style="color:#f96363;">
    <span class="codicon codicon-debug"></span>
    Formatted selected text (debug only)
  </span>
  <br>
  <hr>
  <p></p>
`;
