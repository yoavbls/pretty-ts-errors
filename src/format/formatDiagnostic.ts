import dedent from "ts-dedent";
import { Diagnostic, MarkdownString } from "vscode";
import { title } from "../components/title";
import { formatBody } from "./formatBody";

export const formatDiagnostic = (diagnostic: Diagnostic) => {
  const markdownString = new MarkdownString(dedent/*html*/ `
    ${title(diagnostic)}
    <span>
    ${formatBody(diagnostic)}
    </span>
  `);

  markdownString.isTrusted = true;
  markdownString.supportHtml = true;

  return markdownString;
};
