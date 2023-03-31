import dedent from "ts-dedent";
import { Diagnostic, MarkdownString } from "vscode";
import { title } from "../components/title";
import { formatDiagnosticMessage } from "./formatBody";
import { embedSymbolLinks, identSentences } from "./formatMessageUtils";

export const formatDiagnostic = (diagnostic: Diagnostic) => {
  diagnostic = embedSymbolLinks(diagnostic);

  const markdownString = new MarkdownString(dedent/*html*/ `
    ${title(diagnostic)}
    <span>
    ${formatDiagnosticMessage(identSentences(diagnostic.message))}
    </span>
  `);

  markdownString.isTrusted = true;
  markdownString.supportHtml = true;

  return markdownString;
};
