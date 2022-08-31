import { Diagnostic, MarkdownString } from "vscode";
import { unstyledCodeBlock, inlineCodeBlock } from "./format/codeBlock";
import { errorCodeExternalExplanation } from "./format/externalExplanation";
import { prettyType } from "./format/prettyType";
import { embedSymbolLinks, identSentences } from "./formatMessageUtils";

export const formatDiagnostic = (diagnostic: Diagnostic) => {
  const errorTitle = `<span style="color:#f96363;">⚠ Error</span>${
    typeof diagnostic.code === "number"
      ? ` <span style="color:#5f5f5f;">(TS${
          diagnostic.code
        }) ${errorCodeExternalExplanation(diagnostic.code)}</span>`
      : ""
  }<br>
`;

  const errorBody = embedSymbolLinks(
    identSentences(diagnostic.message),
    diagnostic
  )
    // format backticks
    .replaceAll(/`(.*?)`/g, (_: string, p1: string) => `'${p1}'`)
    // format declare module snippet
    .replaceAll(
      /'(declare module )'(.*)';'/g,
      (_: string, p1: string, p2: string) =>
        formatTypeScriptBlock(_, `${p1} "${p2}"`)
    )
    // format missing props error
    .replaceAll(
      /(is missing the following properties from type .*: )(.+?)(?=and|$)/g,
      (_, pre, post) =>
        `${pre}<ul>${post
          .split(", ")
          .filter(Boolean)
          .map((prop: string) => `<li>${prop}</li>`)
          .join("")}</ul>`
    )
    // Format type pairs
    .replaceAll(
      /(types) '(.*?)' and '(.*?)'[\.]?/gi,
      (_: string, p1: string, p2: string, p3: string) =>
        `${prettyType(p1, p2)} and ${prettyType("", p3)}`
    )
    // Format type annotation options
    .replaceAll(
      /type annotation must be '(.*?)' or '(.*?)'[\.]?/gi,
      (_: string, p1: string, p2: string, p3: string) =>
        `${prettyType(p1, p2)} or ${prettyType("", p3)}`
    )
    // format simple strings
    .replaceAll(/'(".*?")'/g, formatTypeScriptBlock)
    // Format types
    .replaceAll(
      /(type|type alias|interface|module|file|file name) '(.*?)'[\.]?/gi,
      formatTypeOrModuleBlock
    )
    // Format reversed types
    .replaceAll(
      /(.*)'([^>]*)' (type|interface|return type|file|module)/gi,
      (_: string, p1: string, p2: string, p3: string) =>
        `${p1}${formatTypeOrModuleBlock(_, "", p2)} ${p3}`
    )
    // Format simple types that didn't captured before
    .replaceAll(
      /'((void|null|undefined|any|boolean|string|number|bigint|symbol)(\[\])?)'/g,
      formatSimpleTypeBlock
    )
    // Format some typescript key words
    .replaceAll(
      /'(import|export|require|in|continue|break|let|false|true|const|new|throw|await|for await|[0-9]+)( ?.*?)'/g,
      (_: string, p1: string, p2: string) =>
        formatTypeScriptBlock(_, `${p1}${p2}`)
    )
    // Format return values
    .replaceAll(
      /(return|operator) '(.*?)'/gi,
      (_, p1: string, p2: string) => `${p1} ${formatTypeScriptBlock("", p2)}`
    )
    // Format function calls
    .replaceAll(/(\w+\(\))/g, formatTypeScriptBlock)
    // Format regular code blocks
    .replaceAll(/'(.*?)'/g, (_: string, p1: string) => unstyledCodeBlock(p1));

  const errorMessage = `
${errorTitle}
<span>
${errorBody}
</span>
`;
  const markdownString = new MarkdownString(errorMessage);
  markdownString.isTrusted = true;
  markdownString.supportHtml = true;
  return markdownString;
};

const formatTypeScriptBlock = (_: string, code: string) =>
  inlineCodeBlock(code, "typescript");

const formatSimpleTypeBlock = (_: string, code: string) =>
  inlineCodeBlock(code, "type");

const formatTypeOrModuleBlock = (_: string, prefix: string, code: string) =>
  prettyType(
    prefix,
    ["module", "file", "file name"].includes(prefix.toLowerCase())
      ? `"${code}"`
      : code
  );
