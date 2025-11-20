import { formatTypeBlock } from "./formatTypeBlock";

export const formatDiagnosticMessage = (
  message: string,
  codeBlock: (code: string, language?: string, multiLine?: boolean) => string
) => {
  const formatTypeScriptBlock = (_: string, code: string) =>
    codeBlock(code, "typescript");

  const formatSimpleTypeBlock = (_: string, code: string) =>
    codeBlock(code, "type");

  const formatTypeOrModuleBlock = (_: string, prefix: string, code: string) =>
    formatTypeBlock(
      prefix,
      ["module", "file", "file name"].includes(prefix.toLowerCase())
        ? `"${code}"`
        : code,
      codeBlock
    );

  return (
    message
      // format strings wrapped like '"..."' (double quotes inside single quotes)
      .replaceAll(
        /(?:\s)'"(.*?)(?<!\\)"'(?:\s|:|.|$)/g,
        (_: string, p1: string) => formatTypeBlock("", `"${p1}"`, codeBlock)
      )
      // format declare module snippet
      .replaceAll(
        /['“](declare module )['”](.*)['“];['”]/g,
        (_: string, p1: string, p2: string) =>
          formatTypeScriptBlock(_, `${p1} "${p2}"`)
      )
      // format missing props error
      .replaceAll(
        /(is missing the following properties from type\s?)'(.*)': ((?:#?\w+, )*(?:(?!and)\w+)?)/g,
        (_, pre, type, post) =>
          `${pre}${formatTypeBlock("", type, codeBlock)}: <ul>${post
            .split(", ")
            .filter(Boolean)
            .map((prop: string) => `<li>${prop}</li>`)
            .join("")}</ul>`
      )
      // Format type pairs
      .replaceAll(
        /(types) ['“](.*?)['”] and ['“](.*?)['”][.]?/gi,
        (_: string, p1: string, p2: string, p3: string) =>
          `${formatTypeBlock(p1, p2, codeBlock)} and ${formatTypeBlock(
            "",
            p3,
            codeBlock
          )}`
      )
      // Format type annotation options
      .replaceAll(
        /type annotation must be ['“](.*?)['”] or ['“](.*?)['”][.]?/gi,
        (_: string, p1: string, p2: string, p3: string | number) => {
          if (typeof p3 === "string") {
            return `${formatTypeBlock(p1, p2, codeBlock)} or ${formatTypeBlock(
              "",
              p3,
              codeBlock
            )}`;
          } else {
            // If p3 is a number, it is matching a ts(1196) error, see #121
            return `${formatTypeBlock("", p1, codeBlock)} or ${formatTypeBlock(
              "",
              p2,
              codeBlock
            )}`;
          }
        }
      )
      .replaceAll(
        /(Overload \d of \d), ['“](.*?)['”], /gi,
        (_, p1: string, p2: string) =>
          `${p1}${formatTypeBlock("", p2, codeBlock)}`
      )
      // format simple strings
      // NOTE: duplicate of 'format strings wrapper in ""'
      .replaceAll(/^['“]"[^"]*"['”]$/g, formatTypeScriptBlock)
      // Replace module 'x' by module "x" for ts error #2307
      // NOTE: does not actualy seem to work, falls short 1 character, and changing * to a +, will make it to greedy
      .replaceAll(
        /(module )'([^"]*?)'/gi,
        (_, p1: string, p2: string) => `${p1}"${p2}"`
      )
      // Format string types
      // NOTE: used as an 'anchor' to locate parameters, can be replaced with parsed variant
      .replaceAll(
        /(module|file|file name|imported via) ['"“](.*?)['"“](?=[\s(.|,]|$)/gi,
        (_, p1: string, p2: string) => formatTypeBlock(p1, `"${p2}"`, codeBlock)
      )
      // Format types
      // NOTE: used as an 'anchor' to locate parameters, can be replaced with parsed variant
      .replaceAll(
        /(type|type alias|interface|module|file|file name|class|method's|subtype of constraint) ['“](.*?)['“](?=[\s(.|,)]|$)/gi,
        (_, p1: string, p2: string) => formatTypeOrModuleBlock(_, p1, p2)
      )
      // Format reversed types
      // NOTE: used as an 'anchor' to locate parameters, can be replaced with parsed variant
      .replaceAll(
        /(.*)['“]([^>]*)['”] (type|interface|return type|file|module|is (not )?assignable)/gi,
        (_: string, p1: string, p2: string, p3: string) =>
          `${p1}${formatTypeOrModuleBlock(_, "", p2)} ${p3}`
      )
      // Format simple types that didn't captured before
      // NOTE: either an anchor, replacable by parsed variant, or a type embedded in the text part, which we can statically locate when downloading the template maps
      .replaceAll(
        /['“]((void|null|undefined|any|boolean|string|number|bigint|symbol)(\[\])?)['”]/g,
        formatSimpleTypeBlock
      )
      // Format some typescript key words
      // NOTE: can be discovered statically, as keywords are known
      .replaceAll(
        /['“](import|export|require|in|continue|break|let|false|true|const|new|throw|await|for await|[0-9]+)( ?.*?)['”]/g,
        (_: string, p1: string, p2: string) =>
          formatTypeScriptBlock(_, `${p1}${p2}`)
      )
      // Format return values
      .replaceAll(
        // NOTE: can be discovered statically, as keywords are known
        /(return|operator) ['“](.*?)['”]/gi,
        (_, p1: string, p2: string) => `${p1} ${formatTypeScriptBlock("", p2)}`
      )
      // Format regular code blocks
      // NOTE: this is always a parameter, no need for a regex, also seems to get some false positives
      .replaceAll(
        /(?<!\w)'((?:(?!["]).)*?)'(?!\w)/g,
        (_: string, p1: string) => ` ${codeBlock(p1)} `
      )
  );
};
