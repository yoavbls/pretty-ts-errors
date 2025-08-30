import { inlineCodeBlock, unStyledCodeBlock } from "../renderers";
import { formatTypeBlock } from "./formatTypeBlock";

const formatTypeScriptBlock = (_: string, code: string) =>
  inlineCodeBlock(code, "typescript");

const formatSimpleTypeBlock = (_: string, code: string) =>
  inlineCodeBlock(code, "type");

export const formatDiagnosticMessage = (
  message: string,
  format: (type: string) => string
) =>
  message
    .replaceAll(/(?:\s)'"(.*?)(?<!\\)"'(?:\s|:|.|$)/g, (_, p1: string) =>
      formatTypeBlock("", `"${p1}"`, format)
    )
    .replaceAll(
      /['“](declare module )['”](.*)['“];['”]/g,
      (_: string, p1: string, p2: string) =>
        formatTypeScriptBlock(_, `${p1} "${p2}"`)
    )
    .replaceAll(
      /(is missing the following properties from type\s?)'(.*)': ((?:#?\w+, )*(?:(?!and)\w+)?)/g,
      (_, pre, type, post) =>
        `${pre}${formatTypeBlock("", type, format)}: <ul>${post
          .split(", ")
          .filter(Boolean)
          .map((prop: string) => `<li>${prop}</li>`)
          .join("")}</ul>`
    )
    .replaceAll(
      /(types) ['“](.*?)['”] and ['“](.*?)['”][.]?/gi,
      (_: string, p1: string, p2: string, p3: string) =>
        `${formatTypeBlock(p1, p2, format)} and ${formatTypeBlock(
          "",
          p3,
          format
        )}`
    )
    .replaceAll(
      /type annotation must be ['“](.*?)['”] or ['“](.*?)['”][.]?/gi,
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
    .replaceAll(/^['“]"[^"]*"['”]$/g, formatTypeScriptBlock)
    .replaceAll(
      /(module )'([^"]*?)'/gi,
      (_, p1: string, p2: string) => `${p1}"${p2}"`
    )
    .replaceAll(
      /(module|file|file name|imported via) ['"“](.*?)['"“](?=[\s(.|,]|$)/gi,
      (_, p1: string, p2: string) => formatTypeBlock(p1, `"${p2}"`, format)
    )
    .replaceAll(
      /(type|type alias|interface|module|file|file name|class|method's|subtype of constraint) ['“](.*?)['“](?=[\s(.|,)]|$)/gi,
      (_, p1: string, p2: string) => formatTypeBlock(p1, p2, format)
    )
    .replaceAll(
      /(.*)['“]([^>]*)['”] (type|interface|return type|file|module|is (not )?assignable)/gi,
      (_: string, p1: string, p2: string, p3: string) =>
        `${p1}${formatTypeBlock("", p2, format)} ${p3}`
    )
    .replaceAll(
      /['“]((void|null|undefined|any|boolean|string|number|bigint|symbol)(\[\])?)['”]/g,
      formatSimpleTypeBlock
    )
    .replaceAll(
      /['“](import|export|require|in|continue|break|let|false|true|const|new|throw|await|for await|[0-9]+)( ?.*?)['”]/g,
      (_: string, p1: string, p2: string) =>
        inlineCodeBlock(`${p1}${p2}`, "typescript")
    )
    .replaceAll(
      /(return|operator) ['“](.*?)['”]/gi,
      (_, p1: string, p2: string) =>
        `${p1} ${inlineCodeBlock(p2, "typescript")}`
    )
    .replaceAll(
      /(?<!\w)'((?:(?!["]).*?))'(?!\w)/g,
      (_: string, p1: string) => ` ${unStyledCodeBlock(p1)} `
    );
