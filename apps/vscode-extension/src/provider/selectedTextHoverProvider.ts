import { d } from "@pretty-ts-errors/utils";
import { prettifyDiagnosticForHover } from "@pretty-ts-errors/vscode-formatter";
import {
  ExtensionContext,
  ExtensionMode,
  MarkdownString,
  languages,
  window,
} from "vscode";
import { createConverter } from "vscode-languageclient/lib/common/codeConverter";
import { formattedDiagnosticsStore } from "../formattedDiagnosticsStore";

/**
 * Register an hover provider in debug only.
 * It format selected text and help test things visually easier.
 */
export function registerSelectedTextHoverProvider(context: ExtensionContext) {
  if (context.extensionMode !== ExtensionMode.Development) {
    return;
  }

  const converter = createConverter();
  context.subscriptions.push(
    languages.registerHoverProvider(
      {
        language: "typescript",
        pattern: "**/test/**/*.ts",
      },
      {
        async provideHover(document, position) {
          const editor = window.activeTextEditor;

          if (!editor) {
            return;
          }

          const range = document.getWordRangeAtPosition(position);
          const message = editor ? document.getText(editor.selection) : "";

          if (!range || !message) {
            return null;
          }

          const lspDiagnostic = converter.asDiagnostic({
            message,
            range,
            severity: 0,
            source: "ts",
            code: 1337,
          });

          const markdown = new MarkdownString(
            debugHoverHeader + (await prettifyDiagnosticForHover(lspDiagnostic))
          );

          markdown.isTrusted = true;
          markdown.supportHtml = true;

          formattedDiagnosticsStore.set(document.uri.fsPath, [
            {
              range,
              contents: [markdown],
              lspDiagnostic,
            },
          ]);

          return {
            contents: [markdown],
          };
        },
      }
    )
  );
}

const debugHoverHeader = d /*html*/ `
  <span style="color:#f96363;">
    <span class="codicon codicon-debug"></span>
    Formatted selected text (debug only)
  </span>
  <br>
  <hr>
  <p></p>
`;
