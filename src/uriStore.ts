import { MarkdownString, Range, Uri } from "vscode";

export const uriStore: Record<
  Uri["path"],
  {
    range: Range;
    contents: MarkdownString[];
  }[]
> = {};
