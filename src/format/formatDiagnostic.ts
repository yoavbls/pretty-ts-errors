import { Diagnostic } from "vscode-languageserver-types";
import { title } from "../components";
import { d } from "../utils";
import { embedSymbolLinks } from "./embedSymbolLinks";
import { FormatDiagnosticMessageRules, formatDiagnosticMessage } from "./formatDiagnosticMessage";
import { identSentences } from "./identSentences";

export function formatDiagnostic(diagnostic: Diagnostic, format: (type: string) => string, formatRegexes:Record<FormatDiagnosticMessageRules,RegExp>) {
  const newDiagnostic = embedSymbolLinks(diagnostic);

  return d/*html*/ `
    ${title(newDiagnostic)}
    <span>
    ${formatDiagnosticMessage(
      identSentences(newDiagnostic.message),
      format,
      formatRegexes
    )}
    </span>
  `;
}
