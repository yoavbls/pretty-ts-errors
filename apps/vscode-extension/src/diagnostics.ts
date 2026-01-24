import { has } from "@pretty-ts-errors/utils";
import { formatDiagnostic } from "@pretty-ts-errors/vscode-formatter";
import {
  ExtensionContext,
  languages,
  MarkdownString,
  window,
  workspace,
  Uri,
  type Diagnostic,
} from "vscode";
import {
  createConverter,
  type Converter,
} from "vscode-languageclient/lib/common/codeConverter";
import { hoverProvider } from "./provider/hoverProvider";
import {
  formattedDiagnosticsStore,
  type FormattedDiagnostic,
} from "./formattedDiagnosticsStore";
import { logger } from "./logger";

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
  const converter = createConverter();
  context.subscriptions.push(
    languages.onDidChangeDiagnostics(async (e) => {
      logger.measure("onDidChangeDiagnostics", () => {
        e.uris.forEach((uri) => {
          logger.measure(`diagnostics for: ${uri.toString(true)}`, () => {
            const diagnostics = languages.getDiagnostics(uri);
            const supportedDiagnostics = diagnostics.filter(
              (diagnostic) =>
                diagnostic.source &&
                has(supportedDiagnosticSources, diagnostic.source)
            );

            const items: FormattedDiagnostic[] = supportedDiagnostics.map(
              (diagnostic) => getFormattedDiagnostic(diagnostic, uri, converter)
            );

            formattedDiagnosticsStore.set(uri.fsPath, items);

            if (items.length > 0) {
              ensureHoverProviderIsRegistered(uri, context);
            }
          });
        });
      });
    })
  );

  // Clean up formatted diagnostics when text documents are closed
  // This prevents memory leaks from accumulating entries for files that are no longer open
  context.subscriptions.push(
    workspace.onDidCloseTextDocument((document) => {
      formattedDiagnosticsStore.delete(document.uri.fsPath);
      logger.debug(
        `cleaned up formatted diagnostics for closed file: ${document.uri.fsPath}`
      );
    })
  );

  // Clean up formatted diagnostics when files are deleted from the workspace
  context.subscriptions.push(
    workspace.onDidDeleteFiles((event) => {
      event.files.forEach((uri) => {
        formattedDiagnosticsStore.delete(uri.fsPath);
        logger.debug(
          `cleaned up formatted diagnostics for deleted file: ${uri.fsPath}`
        );
      });
    })
  );
}

/**
 * To prevent infinite memory consumtion use a max size for the cache
 *
 * TODO: consider making this configurable to the end user with a sensible `min` and `max`
 */
const CACHE_SIZE_MAX = 100;

/**
 * A local cache that maps TS diagnostics as `string` to their formatted `MarkdownString` counter part.
 * @see https://github.com/yoavbls/pretty-ts-errors/pull/62
 *
 * One reason this cache is critical is because the TypeScript Language Features extension is very noisy and will constantly push all diagnostics for a file,
 * even if there were no actual changes.
 * @see https://github.com/yoavbls/pretty-ts-errors/issues/139#issuecomment-3401279357
 *
 * TODO: create a proper LRU cache, to prevent exceeding the cache size being a bottleneck
 * @see https://github.com/yoavbls/pretty-ts-errors/issues/104
 */
const cache = new Map<string, MarkdownString>();

function getFormattedDiagnostic(
  diagnostic: Diagnostic,
  uri: Uri,
  converter: Converter
): FormattedDiagnostic {
  let formattedMessage = cache.get(diagnostic.message);

  if (!formattedMessage) {
    // formatDiagnostic converts message based on LSP Diagnostic type, not VSCode Diagnostic type, so it can be used in other IDEs.
    // Here we convert VSCode Diagnostic to LSP Diagnostic to make formatDiagnostic recognize it.
    const lspDiagnostic = converter.asDiagnostic(diagnostic);
    const formattedDiagnostic = logger.measure(
      `formatDiagnostic(\`${lspDiagnostic.message}\`)`,
      () => formatDiagnostic(lspDiagnostic, { uri })
    );
    const markdownString = new MarkdownString(formattedDiagnostic);

    // TODO: consider using the `{ enabledCommands: string[] }` variant, to only allow whitelisted commands
    markdownString.isTrusted = true;
    markdownString.supportHtml = true;

    formattedMessage = markdownString;
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
