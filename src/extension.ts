import {
  ExtensionContext,
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
  context.subscriptions.push(
    ...["typescript", "typescriptreact", "javascript", "javascriptreact"].map(
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
    window.onDidChangeActiveColorTheme((e) => {}), // TODO: change background color
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
export function deactivate() {}
