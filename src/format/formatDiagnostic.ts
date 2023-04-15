import { Diagnostic, MarkdownString } from "vscode";
import { title } from "../components";
import { d } from "../utils";
import { embedSymbolLinks } from "./embedSymbolLinks";
import { formatDiagnosticMessage } from "./formatDiagnosticMessage";
import { identSentences } from "./identSentences";

export function formatDiagnostic(diagnostic: Diagnostic) {
  const newDiagnostic = embedSymbolLinks(diagnostic);

  const markdownString = new MarkdownString(d/*html*/ `
    ${title(newDiagnostic)}
    <span>
    ${formatDiagnosticMessage(identSentences(newDiagnostic.message))}
    </span>
  `);

  markdownString.isTrusted = true;
  markdownString.supportHtml = true;

  return markdownString;
}
