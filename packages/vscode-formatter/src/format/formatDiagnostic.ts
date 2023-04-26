import { formatDiagnosticMessage } from "formatter";
import { Diagnostic } from "vscode-languageserver-types";
import { title } from "../components";
import { anyCodeBlock } from "../components/anyCodeBlock";
import { d } from "../deps";
import { embedSymbolLinks } from "./embedSymbolLinks";
import { identSentences } from "./identSentences";

export function formatDiagnostic(diagnostic: Diagnostic) {
  const newDiagnostic = embedSymbolLinks(diagnostic);

  return d/*html*/ `
    ${title(newDiagnostic)}
    <span>
    ${formatDiagnosticMessage(
      identSentences(newDiagnostic.message),
      anyCodeBlock
    )}
    </span>
  `;
}
