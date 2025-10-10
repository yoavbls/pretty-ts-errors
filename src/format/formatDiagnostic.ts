import { Diagnostic } from "vscode-languageserver-types";
import { title } from "../components";
import { d } from "../utils";
import { embedSymbolLinks } from "./embedSymbolLinks";
import { formatDiagnosticMessage } from "./formatDiagnosticMessage";
import { identSentences } from "./identSentences";
import * as logger from '../logger';

export function formatDiagnostic(
  diagnostic: Diagnostic,
  format: (type: string) => string
) {
  return logger.measure(`formatDiagnostic: '${diagnostic.message}'`, () => {
    const newDiagnostic = embedSymbolLinks(diagnostic);
    return d/*html*/ `
      ${title(diagnostic)}
      <span>
      ${formatDiagnosticMessage(identSentences(newDiagnostic.message), format)}
      </span>
    `;
  });
}
