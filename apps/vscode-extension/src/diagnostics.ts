import { has } from "@pretty-ts-errors/utils";
import {
  ExtensionContext,
  languages,
  MarkdownString,
  window,
  Uri,
  type Diagnostic,
} from "vscode";
import { hoverProvider } from "./provider/hoverProvider";
import {
  formattedDiagnosticsStore,
  type FormattedDiagnostic,
} from "./formattedDiagnosticsStore";
import { logger } from "./logger";
import { toLspDiagnostic } from "./lspDiagnostic";
import { createHoverContents } from "./hoverContent";

/**
 * The list of diagnostic sources that pretty-ts-errors supports
 */
const supportedDiagnosticSources = [
  "ts",
  "ts-plugin",
  "deno-ts",
  "js",
  "glint",
];

export function registerOnDidChangeDiagnostics(context: ExtensionContext) {
  context.subscriptions.push(
    languages.onDidChangeDiagnostics(async (e) => {
      await logger.measure("onDidChangeDiagnostics", async () => {
        for (const uri of e.uris) {
          await logger.measure(
            `diagnostics for: ${uri.toString(true)}`,
            async () => {
              const diagnostics = languages.getDiagnostics(uri);
              const supportedDiagnostics = diagnostics.filter(
                (diagnostic) =>
                  diagnostic.source &&
                  has(supportedDiagnosticSources, diagnostic.source)
              );

              const items: FormattedDiagnostic[] = await Promise.all(
                supportedDiagnostics.map((diagnostic) =>
                  getFormattedDiagnostic(diagnostic)
                )
              );

              if (items.length === 0) {
                logger.trace(
                  `no diagnostics for ${uri.toString(true)}, removing from store`
                );
                formattedDiagnosticsStore.delete(uri.fsPath);
              } else {
                logger.trace(
                  `storing ${items.length} formatted diagnostics for ${uri.toString(true)}`
                );
                formattedDiagnosticsStore.set(uri.fsPath, items);
              }

              if (items.length > 0) {
                ensureHoverProviderIsRegistered(uri, context);
              }
            }
          );
        }
      });
    })
  );
}

/**
 * To prevent infinite memory consumption use a max size for the cache
 *
 * TODO: consider making this configurable to the end user with a sensible `min` and `max`
 */
const CACHE_SIZE_MAX = 100;

/**
 * A local cache keyed by diagnostic identity so noisy re-emits do not rebuild hover markdown.
 * @see https://github.com/CyberT33N/pretty-ts-errors/pull/62
 *
 * One reason this cache is critical is because the TypeScript Language Features extension is very noisy and will constantly push all diagnostics for a file,
 * even if there were no actual changes.
 * @see https://github.com/CyberT33N/pretty-ts-errors/issues/139#issuecomment-3401279357
 *
 * TODO: create a proper LRU cache, to prevent exceeding the cache size being a bottleneck
 * @see https://github.com/CyberT33N/pretty-ts-errors/issues/104
 */
const cache = new Map<string, MarkdownString[]>();

async function getFormattedDiagnostic(
  diagnostic: Diagnostic
): Promise<FormattedDiagnostic> {
  // The formatter consumes LSP diagnostics, so keep the VS Code -> LSP conversion as a local first-party boundary.
  const lspDiagnostic = toLspDiagnostic(diagnostic);
  const cacheKey = JSON.stringify({
    code: lspDiagnostic.code ?? null,
    message: diagnostic.message,
    range: lspDiagnostic.range,
  });

  let formattedMessages = cache.get(cacheKey);
  if (formattedMessages === undefined) {
    formattedMessages = createHoverContents(lspDiagnostic);
    if (cache.size > CACHE_SIZE_MAX) {
      const firstCacheKey = cache.keys().next().value!;
      cache.delete(firstCacheKey);
    }
    cache.set(cacheKey, formattedMessages);
  }

  const contents = formattedMessages;

  return {
    range: diagnostic.range,
    contents,
    lspDiagnostic,
  };
}

/**
 * A set to prevent registering duplicate hover providers.
 */
const registeredLanguages = new Set<string>();

/**
 * Ensure a hover provider is registered for any visible editors where pretty-ts-errors has a formatted diagnostic
 */
function ensureHoverProviderIsRegistered(uri: Uri, context: ExtensionContext) {
  const editor = window.visibleTextEditors.find(
    (editor) => editor.document.uri.toString() === uri.toString()
  );
  const languageId = editor?.document.languageId;
  if (languageId && !registeredLanguages.has(languageId)) {
    logger.debug(`registering hover provider for language id: ${languageId}`);
    registeredLanguages.add(languageId);
    context.subscriptions.push(
      languages.registerHoverProvider(
        {
          language: languageId,
        },
        hoverProvider
      )
    );
  }
}
