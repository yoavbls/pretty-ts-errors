import {
  ExtensionContext,
  languages,
  MarkdownString,
  Range,
  window,
} from "vscode";
import { formatDiagnostic } from "./format/formatDiagnostic";
import { hoverProvider } from "./provider/hoverProvider";
import { uriStore } from "./provider/uriStore";
import { has } from "./utils";

export function activate(context: ExtensionContext) {
  const registeredLanguages = new Set<string>();

  context.subscriptions.push(
    languages.onDidChangeDiagnostics(async (e) => {
      e.uris.forEach((uri) => {
        const diagnostics = languages.getDiagnostics(uri);

        const items: {
          range: Range;
          contents: MarkdownString[];
        }[] = [];

        let hasTsDiagnostic = false;

        diagnostics
          .filter((diagnostic) =>
            diagnostic.source
              ? has(["ts", "deno-ts", "js"], diagnostic.source)
              : false
          )
          .forEach(async (diagnostic) => {
            items.push({
              range: diagnostic.range,
              contents: [formatDiagnostic(diagnostic)],
            });
            hasTsDiagnostic = true;
          });
        uriStore[uri.path] = items;

        if (hasTsDiagnostic && uri.scheme === "file") {
          const editor = window.visibleTextEditors.find(
            (editor) => editor.document.uri.toString() === uri.toString()
          );
          if (editor && !registeredLanguages.has(editor.document.languageId)) {
            registeredLanguages.add(editor.document.languageId);
            context.subscriptions.push(
              languages.registerHoverProvider(
                {
                  scheme: "file",
                  language: editor.document.languageId,
                },
                hoverProvider
              )
            );
          }
        }
      });
    })
  );
}
