import {
  ExtensionContext,
  Hover,
  languages,
  MarkdownString,
  Uri,
  window,
} from "vscode";
import { createConverter } from "vscode-languageclient/lib/common/codeConverter";
import { formatDiagnostic } from "./format/formatDiagnostic";
import { prettify } from "./format/prettify";
import { hoverProvider } from "./provider/hoverProvider";
import { registerSelectedTextHoverProvider } from "./provider/selectedTextHoverProvider";
import { uriStore } from "./provider/uriStore";
import { has } from "./utils";
import * as logger from "./logger";

const cache = new Map<string, MarkdownString>();
const CACHE_SIZE_MAX = 1000;
const supportedDiagnosticSources = ["ts", "ts-plugin", "deno-ts", "js", "glint"];

export function activate(context: ExtensionContext) {
  logger.info('activating pretty-ts-errors');

  const registeredLanguages = new Set<string>();
  const converter = createConverter();

  registerSelectedTextHoverProvider(context);

  context.subscriptions.push(
    languages.onDidChangeDiagnostics(async (e) => {
      e.uris.forEach((uri) => {
        logger.measure(`uri: '${uri.toString()}'`, () => {
          const diagnostics = languages.getDiagnostics(uri);
          const supportedDiagnostics = diagnostics.filter(diagnostic => diagnostic.source && has(supportedDiagnosticSources, diagnostic.source))

          const items = supportedDiagnostics.map(diagnostic => {
            let formattedMessage = cache.get(diagnostic.message);
            if (!formattedMessage) {
              // formatDiagnostic converts message based on LSP Diagnostic type, not VSCode Diagnostic type, so it can be used in other IDEs.
              // Here we convert VSCode Diagnostic to LSP Diagnostic to make formatDiagnostic recognize it.
              formattedMessage = new MarkdownString(
                formatDiagnostic(converter.asDiagnostic(diagnostic), prettify)
              );
              formattedMessage.isTrusted = true;
              formattedMessage.supportHtml = true;

              if (cache.size > CACHE_SIZE_MAX) {
                const firstCacheKey = cache.keys().next().value!;
                cache.delete(firstCacheKey);
              }
              cache.set(diagnostic.message, formattedMessage);
            }

            return {
              range: diagnostic.range,
              contents: [formattedMessage],
            };
          });

          if (items.length > 0) {
            uriStore.set(uri.fsPath, items);
            ensureHoverProviderIsRegistered(uri, registeredLanguages, context);
          }
        });
      });

    })
  );
}

function ensureHoverProviderIsRegistered(uri: Uri, registeredLanguages: Set<string>, context: ExtensionContext) {
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

export function deactivate() {
  logger.info('deactivating pretty-ts-errors');
  logger.trace('clearing cache');
  cache.clear();
  logger.trace('clearing uriStore')
  uriStore.clear();
  logger.dispose();
}
