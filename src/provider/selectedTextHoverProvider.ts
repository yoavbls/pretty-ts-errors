import {
  ExtensionContext,
  ExtensionMode,
  MarkdownString,
  languages,
  window,
} from "vscode";
import { createConverter } from "vscode-languageclient/lib/common/codeConverter";
import { miniLine } from "../components";
import { formatDiagnostic } from "../format/formatDiagnostic";
import { prettify } from "../format/prettify";
import { d } from "../utils";
import { uriStore } from './uriStore';

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
          const message = document.getText(editor!.selection);

          const contents =
            range && message
              ? [
                  new MarkdownString(
                    debugHoverHeader +
                      formatDiagnostic(
                        converter.asDiagnostic({
                          message,
                          range,
                          severity: 0,
                          source: "ts",
                          code: 1337,
                        }),
                        document.uri,
                        prettify
                      )
                  ),
                ]
              : [];

          if (contents.length) {
            contents[0].isTrusted = true;
            contents[0].supportHtml = true;
          }

          if (range) {
            uriStore[document.uri.fsPath] = [{ range, contents }];
          }

          return {
            contents,
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
  ${miniLine}
`;
