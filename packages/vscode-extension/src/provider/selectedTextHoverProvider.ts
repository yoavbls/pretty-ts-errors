import { d } from "@pretty-ts-errors/utils";
import { formatDiagnostic } from "@pretty-ts-errors/vscode-formatter";
import { ExtensionContext, MarkdownString, languages, window } from "vscode";
import { createConverter } from "vscode-languageclient/lib/common/codeConverter";

const isDebugMode = () => process.env.VSCODE_DEBUG_MODE === "true";

/**
 * Register an hover provider in debug only.
 * It format selected text and help test things visually easier.
 */
export function registerSelectedTextHoverProvider(context: ExtensionContext) {
  const converter = createConverter();

  if (!isDebugMode()) {
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
                        })
                      )
                  ),
                ]
              : [];

          contents[0].isTrusted = true;
          contents[0].supportHtml = true;

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
  <p></p>
`;
