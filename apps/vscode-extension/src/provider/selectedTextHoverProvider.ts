import {
  Diagnostic,
  DiagnosticSeverity,
  ExtensionContext,
  ExtensionMode,
  languages,
  window,
} from "vscode";
import { formattedDiagnosticsStore } from "../formattedDiagnosticsStore";
import { toLspDiagnostic } from "../lspDiagnostic";
import { createHoverContents } from "../hoverContent";

/**
 * Register an hover provider in debug only.
 * It format selected text and help test things visually easier.
 */
export function registerSelectedTextHoverProvider(context: ExtensionContext) {
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

          const debugDiagnostic = new Diagnostic(
            range,
            message,
            DiagnosticSeverity.Error
          );
          debugDiagnostic.source = "ts";
          debugDiagnostic.code = 1337;

          const lspDiagnostic = toLspDiagnostic(debugDiagnostic);
          const contents = createHoverContents(lspDiagnostic, {
            debugHeader: debugHoverHeader,
          });

          formattedDiagnosticsStore.set(document.uri.fsPath, [
            {
              range,
              contents,
              lspDiagnostic,
            },
          ]);

          return {
            contents,
          };
        },
      }
    )
  );
}

const debugHoverHeader = "**Formatted selected text (debug only)**";
