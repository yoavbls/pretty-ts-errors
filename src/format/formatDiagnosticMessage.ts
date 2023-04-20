import { inlineCodeBlock, unstyledCodeBlock } from "../components";
import { formatTypeBlock } from "./formatTypeBlock";

const formatTypeScriptBlock = (_: string, code: string) =>
  inlineCodeBlock(code, "typescript");

const formatSimpleTypeBlock = (_: string, code: string) =>
  inlineCodeBlock(code, "type");

const formatTypeOrModuleBlock = (
  _: string,
  prefix: string,
  code: string,
  format: (type: string) => string
) =>
  formatTypeBlock(
    prefix,
    ["module", "file", "file name"].includes(prefix.toLowerCase())
      ? `"${code}"`
      : code,
    format
  );

export type FormatDiagnosticMessageRules = 
  | "DeclareModuleSnippet"
  | "MissingPropsError"
  | "TypePairs"
  | "TypeAnnotationOptions"
  | "Overloaded"
  | "SimpleStrings"
  | "Types"
  | "ReversedTypes"
  | "SimpleTypesRest"
  | "TypescriptKeywords"
  | "ReturnValues"
  | "RegularCodeBlocks";

export const formatDiagnosticMessage = (
  message: string,
  format: (type: string) => string,
  regexes: Record<FormatDiagnosticMessageRules, RegExp>
) =>
  message
    // format declare module snippet
    .replaceAll(
      regexes['DeclareModuleSnippet'],
      (_: string, p1: string, p2: string) =>
        formatTypeScriptBlock(_, `${p1} "${p2}"`)
    )
    // format missing props error
    .replaceAll(
      regexes['MissingPropsError'],
      (_, pre, type, post) =>
        `${pre}${formatTypeBlock("", type, format)}: <ul>${post
          .split(", ")
          .filter(Boolean)
          .map((prop: string) => `<li>${prop}</li>`)
          .join('')}</ul>`
    )
    // Format type pairs
    .replaceAll(
      regexes['TypePairs'],
      (_: string, p1: string, p2: string, p3: string) =>
        `${formatTypeBlock(p1, p2, format)} and ${formatTypeBlock(
          "",
          p3,
          format
        )}`
    )
    // Format type annotation options
    .replaceAll(
      regexes['TypeAnnotationOptions'],
      (_: string, p1: string, p2: string, p3: string) =>
        `${formatTypeBlock(p1, p2, format)} or ${formatTypeBlock(
          "",
          p3,
          format
        )}`
    )
    // Format Overloaded
    .replaceAll(
      regexes['Overloaded'],
      (_, p1: string, p2: string) => `${p1}${formatTypeBlock('', p2, format)}`
    )
    // format simple strings
    .replaceAll(regexes['SimpleStrings'], formatTypeScriptBlock)
    // Format types
    .replaceAll(regexes['Types'], (_, p1: string, p2: string) =>
       formatTypeOrModuleBlock(_, p1, p2, format)
    )
    // Format reversed types
    .replaceAll(
      regexes['ReversedTypes'],
      (_: string, p1: string, p2: string, p3: string) =>
        `${p1}${formatTypeOrModuleBlock(_, '', p2, format)} ${p3}`
    )
    // Format simple types that didn't captured before
    .replaceAll(regexes['SimpleTypesRest'], formatSimpleTypeBlock)
    // Format some typescript key words
    .replaceAll(
      regexes['TypescriptKeywords'],
      (_: string, p1: string, p2: string) =>
        formatTypeScriptBlock(_, `${p1}${p2}`)
    )
    // Format return values
    .replaceAll(
      regexes['ReturnValues'],
      (_, p1: string, p2: string) => `${p1} ${formatTypeScriptBlock('', p2)}`
    )
    // Format regular code blocks
    .replaceAll(regexes['RegularCodeBlocks'], (_: string, p1: string) =>
      `${unstyledCodeBlock(p1)} `
    );
