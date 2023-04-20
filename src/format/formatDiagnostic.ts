import { Diagnostic } from "vscode-languageserver-types";
import { title } from "../components";
import { d } from "../utils";
import { embedSymbolLinks } from "./embedSymbolLinks";
import { formatDiagnosticMessage } from "./formatDiagnosticMessage";
import { identSentences } from "./identSentences";
import { getFormatRegexes } from './i18n/locales';

export function formatDiagnostic(diagnostic: Diagnostic, format: (type: string) => string, locale:string) {
  const newDiagnostic = embedSymbolLinks(diagnostic);

  return d/*html*/ `
    ${title(newDiagnostic)}
    <span>
    ${formatDiagnosticMessage(
      identSentences(newDiagnostic.message),
      format,
      getFormatRegexes(locale)
    )}
    </span>
  `;
}
