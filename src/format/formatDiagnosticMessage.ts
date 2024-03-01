import { inlineCodeBlock, unStyledCodeBlock } from "../components";
import { Output } from "../types";
import { formatTypeBlock } from "./formatTypeBlock";

const formatTypeScriptBlock = (
  _: string,
  code: string,
  output: Output = "html"
) => inlineCodeBlock(code, "typescript", output);

const formatSimpleTypeBlock = (_: string, code: string) =>
  inlineCodeBlock(code, "type");

export const formatDiagnosticMessage = (
  message: string,
  format: (type: string) => string,
  output: Output = "html"
) =>
  message
    .replaceAll(/(?:\s)'"(.*?)(?<!\\)"'(?:\s|\:|.|$)/g, (_, p1: string) =>
      formatTypeBlock("", `"${p1}"`, format)
    )
    // format declare module snippet
    .replaceAll(
      /['“](declare module )['”](.*)['“];['”]/g,
      (_: string, p1: string, p2: string) =>
        formatTypeScriptBlock(_, `${p1} "${p2}"`)
    )
    // format missing props error
    .replaceAll(
      /(is missing the following properties from type\s?)'(.*)': ((?:\w+, )*(?:(?!and)\w+)?)/g,
      (_, pre, type, post) =>
        `${pre}${formatTypeBlock("", type, format)}: <ul>${post
          .split(", ")
          .filter(Boolean)
          .map((prop: string) => `<li>${prop}</li>`)
          .join("")}</ul>`
    )
    // Format type pairs
    .replaceAll(
      /(types) ['“](.*?)['”] and ['“](.*?)['”][\.]?/gi,
      (_: string, p1: string, p2: string, p3: string) =>
        `${formatTypeBlock(p1, p2, format)} and ${formatTypeBlock(
          "",
          p3,
          format
        )}`
    )
    // Format type annotation options
    .replaceAll(
      /type annotation must be ['“](.*?)['”] or ['“](.*?)['”][\.]?/gi,
      (_: string, p1: string, p2: string, p3: string) =>
        `${formatTypeBlock(p1, p2, format)} or ${formatTypeBlock(
          "",
          p3,
          format
        )}`
    )
    .replaceAll(
      /(Overload \d of \d), ['“](.*?)['”], /gi,
      (_, p1: string, p2: string) => `${p1}${formatTypeBlock("", p2, format)}`
    )
    // format simple strings
    .replaceAll(/^['“]"[^"]*"['”]$/g, formatTypeScriptBlock)
    // Replace module 'x' by module "x" for ts error #2307
    .replaceAll(
      /(module )'([^"]*?)'/gi,
      (_, p1: string, p2: string) => `${p1}"${p2}"`
    )
    // Format string types
    .replaceAll(
      /(module|file|file name) "(.*?)"(?=[\s(.|,)])/gi,
      (_, p1: string, p2: string) => formatTypeBlock(p1, `"${p2}"`, format)
    )
    // Format types
    .replaceAll(
      /(type|type alias|interface|module|file|file name|method's|subtype of constraint) ['“](.*?)['“](?=[\s(.|,)]|$)/gi,
      (_, p1: string, p2: string) => formatTypeBlock(p1, p2, format)
    )
    // Format reversed types
    .replaceAll(
      /(.*)['“]([^>]*)['”] (type|interface|return type|file|module|is (not )?assignable)/gi,
      (_: string, p1: string, p2: string, p3: string) =>
        `${p1}${formatTypeBlock("", p2, format)} ${p3}`
    )
    // Format simple types that didn't captured before
    .replaceAll(
      /['“]((void|null|undefined|any|boolean|string|number|bigint|symbol)(\[\])?)['”]/g,
      formatSimpleTypeBlock
    )
    // Format some typescript key words
    .replaceAll(
      /['“](import|export|require|in|continue|break|let|false|true|const|new|throw|await|for await|[0-9]+)( ?.*?)['”]/g,
      (_: string, p1: string, p2: string) =>
        formatTypeScriptBlock(_, `${p1}${p2}`)
    )
    // Format return values
    .replaceAll(
      /(return|operator) ['“](.*?)['”]/gi,
      (_, p1: string, p2: string) =>
        `${p1} ${formatTypeScriptBlock("", p2, output)}`
    )
    // Format regular code blocks
    .replaceAll(
      /(?<!.*?")(?:^|\s)['“]((?:(?!:\s*}).)*?)['“](?!\s*:)(?!.*?")/g,
      (_: string, p1: string) => `${unStyledCodeBlock(p1, output)}`
    );
