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
import { createConverter } from "vscode-languageclient/lib/common/codeConverter";
import { format } from "prettier";

export function activate(context: ExtensionContext) {
  const registeredLanguages = new Set<string>();
  const converter = createConverter();

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

            // formatDiagnostic converts message based on LSP Diagnostic type, not VSCode Diagnostic type, so it can be used in other IDEs.
            // Here we convert VSCode Diagnostic to LSP Diagnostic to make formatDiagnostic recognize it.
            const markdownString = new MarkdownString(formatDiagnostic(converter.asDiagnostic(diagnostic), prettify));

            markdownString.isTrusted = true;
            markdownString.supportHtml = true;

            items.push({
              range: diagnostic.range,
              contents: [markdownString],
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

function prettify(text: string) {
  return format(text, {
    parser: "typescript",
    printWidth: 60,
    singleAttributePerLine: false,
    arrowParens: "avoid",
  });
}
