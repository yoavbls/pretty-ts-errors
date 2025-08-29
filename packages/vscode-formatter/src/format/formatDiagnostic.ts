import { formatDiagnosticMessage } from "@pretty-ts-errors/formatter";
import { Diagnostic } from "vscode-languageserver-types";
import { title } from "../components/title";
import { anyCodeBlock } from "../components/anyCodeBlock";
import { d } from "../deps";
import { embedSymbolLinks } from "./embedSymbolLinks";
import { identSentences } from "./identSentences";

export function formatDiagnostic(
  diagnostic: Diagnostic,
  format?: (type: string) => string
) {
  const newDiagnostic = embedSymbolLinks(diagnostic);

  return d/*html*/ `
    ${title(diagnostic)}
    <span>
    ${formatDiagnosticMessage(
      identSentences(newDiagnostic.message),
      anyCodeBlock
    )}
    </span>
  `;
}
