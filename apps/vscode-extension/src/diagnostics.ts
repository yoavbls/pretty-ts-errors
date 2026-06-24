import { has } from "@pretty-ts-errors/utils";
import {
  ExtensionContext,
  languages,
  MarkdownString,
  Uri,
  type Diagnostic,
} from "vscode";
import { SUPPORTED_DIAGNOSTIC_SOURCES } from "./supportedDiagnosticSources";
import { SUPPORTED_LANGUAGE_IDS } from "./supportedLanguageIds";
import { hoverProvider } from "./provider/hoverProvider";
import {
  formattedDiagnosticsStore,
  type FormattedDiagnostic,
} from "./formattedDiagnosticsStore";
import { logger } from "./logger";
import { toLspDiagnostic } from "./lspDiagnostic";
import { createHoverContents } from "./hoverContent";

export function registerOnDidChangeDiagnostics(context: ExtensionContext) {
  logger.debug("registering diagnostic change listener");
  void syncCurrentDiagnostics();

  context.subscriptions.push(
    languages.onDidChangeDiagnostics(async (e) => {
      await logger.measure("onDidChangeDiagnostics", async () => {
        for (const uri of e.uris) {
          await updateDiagnosticsForUri(uri);
        }
      });
    })
  );

  registerHoverProviders(context);
}

function registerHoverProviders(context: ExtensionContext) {
  logger.debug(
    `registering hover providers for ${SUPPORTED_LANGUAGE_IDS.length} supported language ids`
  );

  for (const languageId of SUPPORTED_LANGUAGE_IDS) {
    logger.trace(`registering hover provider for language id: ${languageId}`);
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

async function syncCurrentDiagnostics() {
  const diagnosticsByUri = languages.getDiagnostics();
  logger.debug(
    `syncing current diagnostics for ${diagnosticsByUri.length} known document(s)`
  );

  for (const [uri] of diagnosticsByUri) {
    await updateDiagnosticsForUri(uri);
  }
}

async function updateDiagnosticsForUri(uri: Uri) {
  await logger.measure(`diagnostics for: ${uri.toString(true)}`, async () => {
    const diagnostics = languages.getDiagnostics(uri);
    const supportedDiagnostics = diagnostics.filter(
      (diagnostic) =>
        diagnostic.source &&
        has(SUPPORTED_DIAGNOSTIC_SOURCES, diagnostic.source)
    );

    logger.trace(
      `found ${diagnostics.length} total diagnostics and ${supportedDiagnostics.length} supported diagnostics for ${uri.toString(true)}`
    );

    const items: FormattedDiagnostic[] = await Promise.all(
      supportedDiagnostics.map((diagnostic) => getFormattedDiagnostic(diagnostic))
    );

    if (items.length === 0) {
      logger.trace(`no diagnostics for ${uri.toString(true)}, removing from store`);
      formattedDiagnosticsStore.delete(uri.fsPath);
    } else {
      logger.trace(
        `storing ${items.length} formatted diagnostics for ${uri.toString(true)}`
      );
      formattedDiagnosticsStore.set(uri.fsPath, items);
    }
  });
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
    logger.trace(`cache miss for diagnostic ${cacheKey}`);
    formattedMessages = createHoverContents(lspDiagnostic);
    if (cache.size > CACHE_SIZE_MAX) {
      const firstCacheKey = cache.keys().next().value!;
      cache.delete(firstCacheKey);
    }
    cache.set(cacheKey, formattedMessages);
  } else {
    logger.trace(`cache hit for diagnostic ${cacheKey}`);
  }

  const contents = formattedMessages;

  return {
    range: diagnostic.range,
    contents,
    lspDiagnostic,
  };
}

