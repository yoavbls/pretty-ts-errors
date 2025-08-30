import type { Diagnostic } from "vscode-languageserver-types";
import {
  configureRenderers,
  formatDiagnostic,
  formatDiagnosticMessage,
  formatTypeBlock,
  type Diagnostic as CoreDiagnostic,
} from "@pretty-ts-errors/core";

// Minimal default renderers suitable for plain CLI output
configureRenderers({
  inlineCodeBlock: (code: string) => `\`${code}\``,
  multiLineCodeBlock: (code: string) => `\n${code}\n`,
  unStyledCodeBlock: (content: string) => content,
  title: (d: CoreDiagnostic) =>
    typeof d.code === "number" ? `(TS${d.code})` : "",
  html: (strings: TemplateStringsArray, ...expr: unknown[]) =>
    strings.reduce(
      (acc: string, s: string, i: number) =>
        acc + s + (i < expr.length ? String(expr[i]) : ""),
      ""
    ),
});

export function formatTsDiagnostic(
  diagnostic: Diagnostic,
  format: (type: string) => string
) {
  return formatDiagnostic(diagnostic, format);
}

export { formatDiagnosticMessage, formatTypeBlock };
