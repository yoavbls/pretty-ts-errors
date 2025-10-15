import { formatDiagnosticMessage } from "@pretty-ts-errors/formatter";
import { Diagnostic } from "vscode-languageserver-types";
import { title } from "../components/title";
import { anyCodeBlock } from "../components/anyCodeBlock";
import { d } from "@pretty-ts-errors/utils";
import { embedSymbolLinks } from "./embedSymbolLinks";
import { identSentences } from "./identSentences";

export function formatDiagnostic(diagnostic: Diagnostic) {
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
