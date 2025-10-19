import {
  ExtensionContext,
  Range,
  workspace,
  type TextDocumentContentProvider,
} from "vscode";
import { uriStore } from "./uriStore";

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
  provideTextDocumentContent(uri): string {
    const searchParams = new URLSearchParams(uri.query);
    const fsPath = uri.fsPath.replace(/\.md$/, "");
    if (!searchParams.has("range")) {
      return `range query parameter is missing for uri: ${uri}`;
    }
    const items = uriStore[fsPath];
    if (!items) {
      return `no diagnostics found for ${fsPath}`;
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
    /**
     * At this point the user has seen the tooltip and needs to see the markdown preview
     * The preview needed ```type to be formatted correctly to the user but this is no longer needed.
     * The markdown preview needs ```typescript to be formatted correctly.
     * TODO: maybe use a markdown-it plugin instead, its a bit more work, but gives a lot more control than find and replaces of strings
     * TODO: inject the codeicon icon font, else the icons dont show up
     */
    const content = item.contents
      .map((content) =>
        content.value.replaceAll("```type\n", "```typescript\n")
      )
      .join("\n");

    return content;
  },
};

function createRangeFromString(range: string) {
  const [start, end] = range.split("-");
  const [startLine, startCharacter] = start!.split(":").map(Number);
  const [endLine, endCharacter] = end!.split(":").map(Number);
  return new Range(startLine!, startCharacter!, endLine!, endCharacter!);
}
