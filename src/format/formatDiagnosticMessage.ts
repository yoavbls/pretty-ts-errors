import { inlineCodeBlock, unStyledCodeBlock } from "../components";
import { formatTypeBlock } from "./formatTypeBlock";
import diagnosticPatterns from "./diagnosticPatterns.generated.json";
import { nMore, typeKeywords } from "./translations";

const formatTypeScriptBlock = (_: string, code: string) =>
  inlineCodeBlock(code, "typescript");

const formatSimpleTypeBlock = (_: string, code: string) =>
  inlineCodeBlock(code, "type");

type Pattern = { lang: string; regex: string; template: string };

type PatternName = keyof typeof diagnosticPatterns;
type Lang = (typeof diagnosticPatterns)[PatternName][number]["lang"];

const createPatternWithQuotesAround = (pattern: string) => {
  const escapedPattern = pattern.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
  return new RegExp(
    `\\p{QMark}${escapedPattern}\\p{QMark}|${escapedPattern}`,
    "gu",
  );
};

const getPattern = (name: PatternName, lang: Lang): Pattern => {
  const pattern = diagnosticPatterns[name];
  const matchedPattern = pattern.find((p) => p.lang === lang);
  if (!matchedPattern) {
    throw new Error(`Could not find pattern for ${name} in ${lang}`);
  }
  return matchedPattern;
};

const tryReplaceWithAllPatterns = (
  message: string,
  patterns: Pattern[],
  replaceWith: (captures: Record<string, string>, lang: Lang) => string,
) => {
  for (const pattern of patterns) {
    let isMatched = false;
    const replaced = message.replace(
      new RegExp(pattern.regex, "gm"),
      (_, ...captures) => {
        const groups = captures.at(-1)!;
        isMatched = true;
        return replaceWith(groups, pattern.lang);
      },
    );
    if (isMatched) {
      return replaced;
    }
  }
  return message;
};

const formatMissingProps = (
  lang: Lang,
  format: (type: string) => string,
  actualType: string,
  expectedType: string,
  properties: string[],
) => {
  const pattern = getPattern("propertiesMissingWithoutTruncation", lang);
  return pattern.template
    .replace(
      createPatternWithQuotesAround("{actualType}"),
      formatTypeBlock("", actualType, format),
    )
    .replace(
      createPatternWithQuotesAround("{expectedType}"),
      formatTypeBlock("", expectedType, format),
    )
    .replace(
      "{properties}",
      `<ul>${properties.map((prop) => `<li>${prop}</li>`).join("")}</ul>\n`,
    );
};

export const formatDiagnosticMessage = (
  message: string,
  format: (type: string) => string,
) => {
  // format missing props error
  const formattedTemp1 = tryReplaceWithAllPatterns(
    message,
    diagnosticPatterns.propertiesMissingWithTruncation,
    (
      { actualType, expectedType, properties, numTruncatedProperties },
      lang,
    ) => {
      return formatMissingProps(lang, format, actualType, expectedType, [
        ...properties.split(", ").filter(Boolean),
        (nMore[lang] || nMore.fallback).replace(
          "{numTruncatedProperties}",
          numTruncatedProperties,
        ),
      ]);
    },
  );
  const formattedTemp2 = tryReplaceWithAllPatterns(
    formattedTemp1,
    diagnosticPatterns.propertiesMissingWithoutTruncation,
    ({ actualType, expectedType, properties }, lang) => {
      return formatMissingProps(
        lang,
        format,
        actualType,
        expectedType,
        properties.split(", ").filter(Boolean),
      );
    },
  );

  // Format overloads
  const formattedTemp3 = tryReplaceWithAllPatterns(
    formattedTemp2,
    diagnosticPatterns.overloadError,
    ({ overloadIndex, numOverloads, signature }, lang) => {
      const pattern = getPattern("overloadError", lang);
      return (
        pattern.template
          .replace("{overloadIndex}", overloadIndex)
          .replace("{numOverloads}", numOverloads)
          // Remove quotes around signature
          .replace(
            createPatternWithQuotesAround("{signature}"),
            formatTypeBlock("", signature, format),
          )
      );
    },
  );

  return (
    formattedTemp3
      .replaceAll(/(?:\s)'"(.*?)(?<!\\)"'(?:\s|:|.|$)/g, (_, p1: string) =>
        formatTypeBlock("", `"${p1}"`, format),
      )
      // format declare module snippet
      .replaceAll(
        /['“](declare module )['”](.*)['“];['”]/g,
        (_: string, p1: string, p2: string) =>
          formatTypeScriptBlock(_, `${p1} "${p2}"`),
      )
      // Format type pairs
      .replaceAll(
        /(types) ['“](.*?)['”] and ['“](.*?)['”][.]?/gi,
        (_: string, p1: string, p2: string, p3: string) =>
          `${formatTypeBlock(p1, p2, format)} and ${formatTypeBlock(
            "",
            p3,
            format,
          )}`,
      )
      // Format type annotation options
      .replaceAll(
        /type annotation must be ['“](.*?)['”] or ['“](.*?)['”][.]?/gi,
        (_: string, p1: string, p2: string, p3: string) =>
          `${formatTypeBlock(p1, p2, format)} or ${formatTypeBlock(
            "",
            p3,
            format,
          )}`,
      )
      .replaceAll(
        /(Overload \d of \d), ['“](.*?)['”], /gi,
        (_, p1: string, p2: string) =>
          `${p1}${formatTypeBlock("", p2, format)}`,
      )
      // format simple strings
      .replaceAll(/^['“]"[^"]*"['”]$/g, formatTypeScriptBlock)
      // Replace module 'x' by module "x" for ts error #2307
      .replaceAll(
        /(module )'([^"]*?)'/gi,
        (_, p1: string, p2: string) => `${p1}"${p2}"`,
      )
      // Format string types
      .replaceAll(
        /(module|file|file name|imported via) ['"“](.*?)['"“](?=[\s(.|,]|$)/gi,
        (_, p1: string, p2: string) => formatTypeBlock(p1, `"${p2}"`, format),
      )
      // Format types
      .replaceAll(
        /(type|type alias|interface|module|file|file name|class|method's|subtype of constraint) ['“](.*?)['“](?=[\s(.|,)]|$)/gi,
        (_, p1: string, p2: string) => formatTypeBlock(p1, p2, format),
      )
      // Format reversed types
      .replaceAll(
        /(.*)['“]([^>]*)['”] (type|interface|return type|file|module|is (not )?assignable)/gi,
        (_: string, p1: string, p2: string, p3: string) =>
          `${p1}${formatTypeBlock("", p2, format)} ${p3}`,
      )
      // Format simple types that didn't captured before
      .replaceAll(
        /['“]((void|null|undefined|any|boolean|string|number|bigint|symbol)(\[\])?)['”]/g,
        formatSimpleTypeBlock,
      )
      // Format some typescript key words
      .replaceAll(
        /['“](import|export|require|in|continue|break|let|false|true|const|new|throw|await|for await|[0-9]+)( ?.*?)['”]/g,
        (_: string, p1: string, p2: string) =>
          formatTypeScriptBlock(_, `${p1}${p2}`),
      )
      // Format return values
      .replaceAll(
        /(return|operator) ['“](.*?)['”]/gi,
        (_, p1: string, p2: string) => `${p1} ${formatTypeScriptBlock("", p2)}`,
      )
      // Format regular code blocks
      .replaceAll(
        /(?<!\w)'((?:(?!["]).)*?)'(?!\w)/g,
        (_: string, p1: string) => ` ${unStyledCodeBlock(p1)} `,
      )
  );
};
