import {
  ExtensionContext,
  Range,
  workspace,
  type TextDocumentContentProvider,
} from "vscode";
import { formattedDiagnosticsStore } from "../formattedDiagnosticsStore";

export const PRETTY_TS_ERRORS_SCHEME = "pretty-ts-errors";

export function registerTextDocumentProvider(context: ExtensionContext) {
  context.subscriptions.push(
    workspace.registerTextDocumentContentProvider(
      PRETTY_TS_ERRORS_SCHEME,
      textDocumentContentProvider
    )
  );
}

export const textDocumentContentProvider: TextDocumentContentProvider = {
  /**
   * Provides the text document content for uri's with the scheme `pretty-ts-errors`
   * @see https://code.visualstudio.com/api/extension-guides/virtual-documents#textdocumentcontentprovider
   * @example
   * ```
   * const matchingUri = Uri.parse(`pretty-ts-errors:/path/to/file.ts.md`)
   * ```
   */
  provideTextDocumentContent(uri): string {
    const searchParams = new URLSearchParams(uri.query);
    if (!uri.fsPath.endsWith(".md")) {
      return `only supports .md file extensions for ${uri.fsPath}`;
    }
    const fsPath = uri.fsPath.slice(0, -3);
    const items = formattedDiagnosticsStore.get(fsPath);
    if (!items) {
      return `no diagnostics found for ${fsPath}`;
    }
    if (!searchParams.has("range")) {
      return `range query parameter is missing for uri: ${uri}`;
    }
    const range = createRangeFromString(searchParams.get("range")!);
    const item = items.find((item) => {
      return item.range.isEqual(range);
    });
    if (!item) {
      return `no diagnostic found for ${fsPath} with range ${JSON.stringify(
        range
      )}`;
    }
    return item.contents.map((content) => content.value).join("\n");
  },
};

/**
 * @example
 * ```ts
 * const uri = Uri.parse('ts-pretty-errors:/some/file.ts.md?range=1:0-1:15');
 * const searchParams = new URLSearchParams(uri.query);
 * const range = createRangeFromString(searchParams.get('range'));
 * //     ^ -> Range { start: Position { line: 1, character: 0 }, end: Position: { line: 1, character: 15 } }
 * ```
 */
function createRangeFromString(range: string) {
  const [start, end] = range.split("-");
  const [startLine, startCharacter] = start!.split(":").map(Number);
  const [endLine, endCharacter] = end!.split(":").map(Number);
  return new Range(startLine!, startCharacter!, endLine!, endCharacter!);
}
