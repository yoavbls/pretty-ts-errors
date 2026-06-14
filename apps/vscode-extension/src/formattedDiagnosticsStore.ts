import { MarkdownString, Range, Uri } from "vscode";
import type { Diagnostic } from "vscode-languageserver-types";

type StoreKey = Uri["fsPath"];

export interface FormattedDiagnostic {
  range: Range;
  contents: MarkdownString[];
  /** Original LSP diagnostic for on-demand sidebar formatting */
  lspDiagnostic: Diagnostic;
}

/**
 * A store for formatted diagnostics, where the key is the file path to a file, and the value a collection of formatted diagnostics for that file.
 *
 * The `onDidChangeDiagnostics` event handler will fill the store with formatted diagnostics, while other components will query the store to display these diagnostics.
 */
export const formattedDiagnosticsStore = new Map<
  StoreKey,
  FormattedDiagnostic[]
>();
