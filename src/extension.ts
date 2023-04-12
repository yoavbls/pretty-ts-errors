import {
  ExtensionContext,
  extensions,
  languages,
  MarkdownString,
  Range,
  window,
} from "vscode";
import { formatDiagnostic } from "./format/formatDiagnostic";
import { hoverProvider } from "./hoverProvider";
import { uriStore } from "./uriStore";
import { has } from "./utils";

export function activate(context: ExtensionContext) {

  const languagesId: string[] = [...new Set(["typescript", "typescriptreact", "javascript", "javascriptreact", ...getMetaFrameworkLanguages()])];

  context.subscriptions.push(
    ...languagesId.map(
      (language) =>
        languages.registerHoverProvider(
          {
            scheme: "file",
            language,
          },
          hoverProvider
        )
    )
  );

  context.subscriptions.push(
    window.onDidChangeActiveColorTheme((e) => { }), // TODO: change background color
    languages.onDidChangeDiagnostics(async (e) => {
      e.uris.forEach((uri) => {
        const diagnostics = languages.getDiagnostics(uri);

        const items: {
          range: Range;
          contents: MarkdownString[];
        }[] = [];

        diagnostics
          .filter((diagnostic) =>
            diagnostic.source
              ? has(["ts", "deno-ts"], diagnostic.source)
              : false
          )
          .forEach(async (diagnostic) => {
            items.push({
              range: diagnostic.range,
              contents: [formatDiagnostic(diagnostic)],
            });
          });
        uriStore[uri.path] = items;
      });
    })
  );
}

// this method is called when your extension is deactivated
export function deactivate() { }

function getMetaFrameworkLanguages() {

  const metaFrameworkLanguages: string[] = [];

  for (const extension of extensions.all) {
    const packageJSON = extension.packageJSON;
    for (const language of packageJSON.contributes?.languages ?? []) {
      for (const grammar of packageJSON.contributes.grammars ?? []) {
        const embeddedLanguages = new Set<string>(Object.values(grammar.embeddedLanguages ?? []));
        if (
          embeddedLanguages.has("typescript")
          || embeddedLanguages.has("typescriptreact")
          || embeddedLanguages.has("javascript")
          || embeddedLanguages.has("javascriptreact")
        ) {
          metaFrameworkLanguages.push(language.id);
        }
      }
    }
  }

  return metaFrameworkLanguages;
}
