import { Hover, Uri } from "vscode";

export const uriStore = new Map<
  Uri["path"],
  Hover[]
>();
