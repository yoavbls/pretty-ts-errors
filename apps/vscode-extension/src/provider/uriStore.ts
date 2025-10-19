import { MarkdownString, Range, Uri } from "vscode";

export const uriStore = new Map<
  Uri["path"],
  {
    range: Range;
    contents: MarkdownString[];
  }[]
>();
