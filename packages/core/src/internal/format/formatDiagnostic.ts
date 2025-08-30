import { Diagnostic } from "vscode-languageserver-types";
import { title } from "../renderers";
import { d } from "../renderers";
import { embedSymbolLinks } from "./embedSymbolLinks";
import { formatDiagnosticMessage } from "./formatDiagnosticMessage";
import { identSentences } from "./identSentences";

export function formatDiagnostic(
  diagnostic: Diagnostic,
  format: (type: string) => string
) {
  const newDiagnostic = embedSymbolLinks(diagnostic);

  return d/*html*/ `
    ${title(diagnostic)}
    <span>
    ${formatDiagnosticMessage(identSentences(newDiagnostic.message), format)}
    </span>
  `;
}
