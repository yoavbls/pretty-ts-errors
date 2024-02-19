import { Diagnostic } from "vscode-languageserver-types";
import { title } from "../components";
import { d } from "../utils";
import { embedSymbolLinks } from "./embedSymbolLinks";
import { formatDiagnosticMessage } from "./formatDiagnosticMessage";
import { identSentences } from "./identSentences";
import { Output } from "../types";

export function formatDiagnostic(
  diagnostic: Diagnostic,
  format: (type: string) => string,
  output: Output
) {
  const newDiagnostic = embedSymbolLinks(diagnostic);

  switch (output) {
    case "html":
      return d/*html*/ `
        ${title(diagnostic, output)}
        <span>
        ${formatDiagnosticMessage(
          identSentences(newDiagnostic.message),
          format
        )}
        </span>
      `;
    case "plaintext":
      return d`
        ${formatDiagnosticMessage(
          identSentences(newDiagnostic.message),
          format,
          output
        )}

      `;
  }
}
