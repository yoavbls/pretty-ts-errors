import { has } from "@pretty-ts-errors/utils";
import { formatDiagnostic } from "@pretty-ts-errors/vscode-formatter";
import {
  ExtensionContext,
  languages,
  MarkdownString,
  Range,
  window,
} from "vscode";
import { createConverter } from "vscode-languageclient/lib/common/codeConverter";
import { hoverProvider } from "./provider/hoverProvider";
import { registerSelectedTextHoverProvider } from "./provider/selectedTextHoverProvider";
import { uriStore } from "./provider/uriStore";
import { registerTextDocumentProvider } from "./provider/textDocumentContentProvider";
import { registerMarkdownWebviewProvider } from "./provider/markdownWebiewProvider";
import { registerRevealSelection } from "./commands/revealSelection";

const cache = new Map();

export function activate(context: ExtensionContext) {
  const registeredLanguages = new Set<string>();
  const converter = createConverter();

  registerSelectedTextHoverProvider(context);
  registerTextDocumentProvider(context);
  registerMarkdownWebviewProvider(context);
  registerRevealSelection(context);

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
              ? has(
                  ["ts", "ts-plugin", "deno-ts", "js", "glint"],
                  diagnostic.source
                )
              : false
          )
          .forEach(async (diagnostic) => {
            // formatDiagnostic converts message based on LSP Diagnostic type, not VSCode Diagnostic type, so it can be used in other IDEs.
            // Here we convert VSCode Diagnostic to LSP Diagnostic to make formatDiagnostic recognize it.
            let formattedMessage = cache.get(diagnostic.message);

            if (!formattedMessage) {
              const markdownString = new MarkdownString(
                formatDiagnostic(converter.asDiagnostic(diagnostic), uri)
              );

              markdownString.isTrusted = true;
              markdownString.supportHtml = true;

              formattedMessage = markdownString;
              cache.set(diagnostic.message, formattedMessage);

              if (cache.size > 100) {
                const firstCacheKey = cache.keys().next().value;
                cache.delete(firstCacheKey);
              }
            }

            items.push({
              range: diagnostic.range,
              contents: [formattedMessage],
            });

            hasTsDiagnostic = true;
          });

        uriStore[uri.fsPath] = items;

        if (hasTsDiagnostic) {
          const editor = window.visibleTextEditors.find(
            (editor) => editor.document.uri.toString() === uri.toString()
          );
          if (editor && !registeredLanguages.has(editor.document.languageId)) {
            registeredLanguages.add(editor.document.languageId);
            context.subscriptions.push(
              languages.registerHoverProvider(
                {
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
