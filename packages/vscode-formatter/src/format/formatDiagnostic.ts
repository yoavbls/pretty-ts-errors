import { formatDiagnosticMessage } from "@pretty-ts-errors/formatter";
import { Diagnostic } from "vscode-languageserver-types";
import type { URI } from "vscode-uri";
import { title } from "../components/title";
import { anyCodeBlock } from "../components/anyCodeBlock";
import { d } from "@pretty-ts-errors/utils";
import { embedSymbolLinks } from "./embedSymbolLinks";
import { identSentences } from "./identSentences";

interface FormatDiagnosticOptions {
  uri?: URI;
}

export function formatDiagnostic(
  diagnostic: Diagnostic,
  options?: FormatDiagnosticOptions
) {
  const newDiagnostic = embedSymbolLinks(diagnostic);

  return d/*html*/ `
    ${title(diagnostic, options?.uri)}
    <span>
    ${formatDiagnosticMessage(
      identSentences(newDiagnostic.message),
      anyCodeBlock
    )}
    </span>
  `;
}
