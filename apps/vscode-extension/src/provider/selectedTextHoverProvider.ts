import { prettifyDiagnosticForHover } from "@pretty-ts-errors/vscode-formatter";
import {
  Diagnostic,
  DiagnosticSeverity,
  ExtensionContext,
  ExtensionMode,
  MarkdownString,
  languages,
  window,
} from "vscode";
import { formattedDiagnosticsStore } from "../formattedDiagnosticsStore";
import { enabledCommands } from "../commands/enabledCommands";
import { toLspDiagnostic } from "../lspDiagnostic";

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

          const markdown = new MarkdownString(
            debugHoverHeader + (await prettifyDiagnosticForHover(lspDiagnostic))
          );

          markdown.isTrusted = { enabledCommands };
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

const debugHoverHeader = [
  '<span style="color:#f96363;">',
  '  <span class="codicon codicon-debug"></span>',
  "  Formatted selected text (debug only)",
  "</span>",
  "<br>",
  "<hr>",
  "<p></p>",
].join("\n");
