import { formatDiagnosticMessage } from "@pretty-ts-errors/formatter";
import { Diagnostic } from "vscode-languageserver-types";
import type { URI } from "vscode-uri";
import { title } from "../components/title";
import { anyCodeBlock } from "../components/anyCodeBlock";
import { d } from "@pretty-ts-errors/utils";
import { embedSymbolLinks } from "./embedSymbolLinks";
import { identSentences } from "./identSentences";

export function formatDiagnostic(diagnostic: Diagnostic, uri?: URI) {
  const newDiagnostic = embedSymbolLinks(diagnostic);

  return d/*html*/ `
    ${title(diagnostic, uri)}
    <span>
    ${formatDiagnosticMessage(
      identSentences(newDiagnostic.message),
      anyCodeBlock
    )}
    </span>
  `;
}
