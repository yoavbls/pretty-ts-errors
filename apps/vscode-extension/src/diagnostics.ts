import { has } from "@pretty-ts-errors/utils";
import { formatDiagnostic } from "@pretty-ts-errors/vscode-formatter";
import {
  ExtensionContext,
  languages,
  MarkdownString,
  Range,
  window,
  Uri,
} from "vscode";
import { createConverter } from "vscode-languageclient/lib/common/codeConverter";
import { hoverProvider } from "./provider/hoverProvider";
import { uriStore } from "./provider/uriStore";

const cache = new Map();
const CACHE_SIZE_MAX = 100;
const supportedDiagnosticSources = [
  "ts",
  "ts-plugin",
  "deno-ts",
  "js",
  "glint",
];
const registeredLanguages = new Set<string>();

export function registerOnDidChangeDiagnostics(context: ExtensionContext) {
  const converter = createConverter();
  context.subscriptions.push(
    languages.onDidChangeDiagnostics(async (e) => {
      e.uris.forEach((uri) => {
        const diagnostics = languages.getDiagnostics(uri);
        const supportedDiagnostics = diagnostics.filter(
          (diagnostic) =>
            diagnostic.source &&
            has(supportedDiagnosticSources, diagnostic.source)
        );

        const items: {
          range: Range;
          contents: MarkdownString[];
        }[] = supportedDiagnostics.map((diagnostic) => {
          // formatDiagnostic converts message based on LSP Diagnostic type, not VSCode Diagnostic type, so it can be used in other IDEs.
          // Here we convert VSCode Diagnostic to LSP Diagnostic to make formatDiagnostic recognize it.
          let formattedMessage = cache.get(diagnostic.message);

          if (!formattedMessage) {
            const markdownString = new MarkdownString(
              formatDiagnostic(converter.asDiagnostic(diagnostic))
            );

            markdownString.isTrusted = true;
            markdownString.supportHtml = true;

            formattedMessage = markdownString;
            cache.set(diagnostic.message, formattedMessage);

            if (cache.size > CACHE_SIZE_MAX) {
              const firstCacheKey = cache.keys().next().value;
              cache.delete(firstCacheKey);
            }
          }

          return {
            range: diagnostic.range,
            contents: [formattedMessage],
          };
        });

        uriStore.set(uri.fsPath, items);

        if (items.length > 0) {
          ensureHoverProviderIsRegistered(uri, context);
        }
      });
    })
  );
}

function ensureHoverProviderIsRegistered(uri: Uri, context: ExtensionContext) {
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
