import { parseTemplate, TemplateTextPart, TemplateParamPart } from "./template";

export type AnnotatedTemplate = AnnotatedTemplatePart[];

export type AnnotatedTemplatePart =
  | AnnotatedTemplateTextPart
  | AnnotatedTemplateParamPart;

export interface AnnotatedTemplateTextPart extends TemplateTextPart {
  annotations: TextPartAnnotation[];
}

export interface AnnotatedTemplateParamPart extends TemplateParamPart {
  annotations: never[];
}

export type TextPartAnnotation =
  | JsonLiteralAnnotation
  | JsonKeyValuePairAnnotation
  | KeywordAnnotation
  | StringLiteralAnnotation;

export interface JsonLiteralAnnotation {
  type: "json-literal";
  index: number;
  length: number;
  quote: QuoteType;
}

export interface JsonKeyValuePairAnnotation {
  type: "json-key-value-pair";
  index: number;
  length: number;
  quote: QuoteType;
}

export interface KeywordAnnotation {
  type: "keyword";
  index: number;
  length: number;
  quote: QuoteType;
}

export interface StringLiteralAnnotation {
  type: "string-literal";
  index: number;
  length: number;
  quote: QuoteType;
}

/**
 * creates an `AnnotatedTemplate` for the given diagnostic message `template`.
 * @example
 * ```ts
 * const code = 1326;
 * const template = `This use of 'import' is invalid. 'import()' calls can be written, but they must have parentheses and cannot have type arguments.`;
 * const annotatedTemplate = getAnnotatedTemplate(template);
 * // results in the literal:
 * const annotatedTemplateLiteral = [
 *   {
 *      part: {
 *        type: "text",
 *        text: "This use of 'import' is invalid. 'import()' calls can be written, but they must have parentheses and cannot have type arguments."
 *      },
 *      annotations: [
 *        {
 *          type: "keyword",
 *          index: 12,
 *          length: 8,
 *          quote: "'"
 *        },
 *        {
 *          type: "string-literal",
 *          index: 19,
 *          length: 15,
 *          quote: "'"
 *        }
 *      ]
 *    }
 *  ]
 * ```
 */
export function getAnnotatedTemplate(template: string): AnnotatedTemplate {
  const parts = parseTemplate(template);
  return parts.map((part, index) => {
    switch (part.type) {
      case "text": {
        // - text
        //   - keywords (single, double or backtick quotes)
        //   - string literals
        //   - json key value's, usually configuration examples
        return getAnnotatedTemplateTextPart(part);
      }
      case "param": {
        // - params
        //   - quoted params
        //   - quote kind (backtick, double quote, single quote)
        // NOTE: already moved this part to parseTemplate, maybe move all of this?
        return {
          ...part,
          annotations: [],
        };
      }
    }
  });
}

function getAnnotatedTemplateTextPart(
  part: TemplateTextPart
): AnnotatedTemplateTextPart {
  /**
   * NOTE: the order matters, because json literals and key value pairs can contain keywords and string literals.
   *       `ignoredRanges` is used to indicate quotes that should be ignored
   */
  const getAnnotationFns = [
    // NOTE: there are only 2 templates with a json-literal
    getJsonLiteralAnnotations,
    // NOTE: there are only 4 templates with a json-key-value-pair
    getJsonKeyValuePairAnnotations,
    getKeywordAnnotations,
    getStringLiteralAnnotations,
  ];
  const ignoredRanges: [index: number, length: number][] = [];
  const annotations = getAnnotationFns.reduce<TextPartAnnotation[]>(
    (result, fn) => {
      const annotations = fn(part, ignoredRanges);
      ignoredRanges.push(
        ...annotations.map(
          (annotation) =>
            [annotation.index, annotation.length] as [number, number]
        )
      );
      result.push(...annotations);
      return result;
    },
    []
  );
  return {
    ...part,
    annotations,
  };
}

function isIndexInIgnoredRanges(
  index: number,
  ignoredRanges: [index: number, length: number][]
) {
  return ignoredRanges.some(([startIndex, length]) => {
    return index >= startIndex && index <= startIndex + length;
  });
}

const quoteTypes = ["'", '"', "`"] as const;
type QuoteType = (typeof quoteTypes)[number];

/**
 * `"` wont be used to surround a json literal
 */
const validJsonQuoteTypes = quoteTypes.filter((quote) => quote !== '"');

/**
 *
 * @example
 * ```ts
 * const code = 1480;
 * const template = "To convert this file to an ECMAScript module, change its file extension to \'{0}\' or create a local package.json file with `{ "type": "module" }`.";
 * const annotations = getJsonLiteralAnnotations(template, []);
 * // results in the literal:
 * const annotationsLiteral = [
 *   {
 *      type: "json-literal",
 *      index: 42,
 *      length: 22,
 *      quote: "`"
 *   }
 * ];
 * ```
 */
function getJsonLiteralAnnotations(
  part: TemplateTextPart,
  ignoredRanges: [index: number, length: number][]
): JsonLiteralAnnotation[] {
  return validJsonQuoteTypes.reduce<JsonLiteralAnnotation[]>(
    (results, quote) => {
      let index = -1;
      do {
        index = part.text.indexOf(quote, index + 1);
        if (index !== -1) {
          if (isIndexInIgnoredRanges(index, ignoredRanges)) {
            index += 1;
            continue;
          }
          // json literal in a diagnostic will always start with `{ "`
          if (part.text.slice(index + 1, index + 4) !== '{ "') {
            index = index + 1;
            continue;
          }
          let endIndex = -1;
          inner: do {
            endIndex = part.text.indexOf(quote, index + 1);
            if (endIndex !== -1) {
              results.push({
                type: "json-literal",
                index,
                length: endIndex + 1 - index,
                quote,
              });
              index = endIndex;
              break inner;
            }
          } while (endIndex !== -1);
        }
      } while (index !== -1);
      return results;
    },
    []
  );
}

/**
 *
 * @example
 * ```ts
 * const code = ;
 * const template = "To convert this file to an ECMAScript module, change its file extension to '{0}', or add the field `\"type\": \"module\"` to '{1}'.";
 * const annotations = getJsonKeyValuePairAnnotations(template, []);
 * // results in the literal:
 * const annotationsLiteral = [
 *
 * ];
 * ```
 */
function getJsonKeyValuePairAnnotations(
  part: TemplateTextPart,
  ignoredRanges: [index: number, length: number][]
): JsonKeyValuePairAnnotation[] {
  return validJsonQuoteTypes.reduce<JsonKeyValuePairAnnotation[]>(
    (results, quote) => {
      let index = -1;
      do {
        index = part.text.indexOf(quote, index + 1);
        if (index !== -1) {
          if (isIndexInIgnoredRanges(index, ignoredRanges)) {
            index += 1;
            continue;
          }
          // json key value pair will always start with `"`
          if (part.text[index + 1] !== '"') {
            index = index + 1;
            continue;
          }
          let endIndex = -1;
          inner: do {
            // look for the closing quote of the property key
            endIndex = part.text.indexOf('"', index + 2);
            // json key value pair will follow the property key with an immediate `:`
            if (endIndex === -1 || part.text[endIndex + 1] !== ":") {
              index = index + 1;
              break inner;
            }
            // find the closing quote of the json key value pair
            endIndex = part.text.indexOf(quote, index + 3);
            if (endIndex !== -1) {
              results.push({
                type: "json-key-value-pair",
                index,
                length: endIndex + 1 - index,
                quote,
              });
              index = endIndex;
              break inner;
            }
          } while (endIndex !== -1);
        }
      } while (index !== -1);
      return results;
    },
    []
  );
}

/**
 * List of keywords, or reserved identifiers (in specific contexts)
 * JS: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Lexical_grammar#keywords
 * TS: https://github.com/microsoft/TypeScript/issues/2536#issuecomment-87194347
 */
const keywords = [
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "else",
  "export",
  "extends",
  "false",
  "finally",
  "for",
  "function",
  "if",
  "import",
  "in",
  "instanceof",
  "new",
  "null",
  "return",
  "super",
  "switch",
  "this",
  "throw",
  "true",
  "try",
  "typeof",
  "var",
  "void",
  "while",
  "with",
  // strict mode
  "let",
  "static",
  "yield",
  // modules / async function bodies
  "await",
  // future reserved
  "enum",
  // future reserved in strict mode
  "implements",
  "interface",
  "package",
  "private",
  "protected",
  "public",
  // context specific
  "arguments",
  "as",
  "async",
  "eval",
  "from",
  "get",
  "of",
  "set",
  // typescript specific
  "any",
  "boolean",
  "constructor",
  "declare",
  "module",
  "require",
  "number",
  "string",
  "symbol",
  "type",
  "namespace",
] as const;

/**
 * A collection of the keywords quoted with:
 * - single quotes
 * - double quotes
 * - backticks
 *
 * @example
 * ```ts
 * {
 *  'boolean': ["'boolean'", "\"boolean\"", "`boolean`"]
 * }
 * ```
 */
const quotedKeywords = keywords.reduce<Record<string, string[]>>(
  (map, keyword) => {
    map[keyword] = quoteTypes.map((quote) => `${quote}${keyword}${quote}`);
    return map;
  },
  {}
);

function getKeywordAnnotations(
  part: TemplateTextPart,
  ignoredRanges: [index: number, length: number][]
): KeywordAnnotation[] {
  return Object.entries(quotedKeywords).reduce<KeywordAnnotation[]>(
    (results, [keyword, quoted]) => {
      quoted.flatMap((quoted) => {
        let index = -1;
        do {
          index = part.text.indexOf(quoted, index + 1);
          if (index !== -1) {
            if (isIndexInIgnoredRanges(index, ignoredRanges)) {
              index += 1;
              continue;
            }
            results.push({
              type: "keyword",
              index,
              length: quoted.length,
              quote: quoted[0] as QuoteType,
            });
          }
        } while (index !== -1);
      });
      return results;
    },
    []
  );
}

function getStringLiteralAnnotations(
  part: TemplateTextPart,
  ignoredRanges: [index: number, length: number][]
): StringLiteralAnnotation[] {
  return quoteTypes.reduce<StringLiteralAnnotation[]>((results, quote) => {
    let index = -1;
    do {
      index = part.text.indexOf(quote, index + 1);
      if (index !== -1) {
        if (isIndexInIgnoredRanges(index, ignoredRanges)) {
          index += 1;
          continue;
        }
        let endIndex = -1;
        inner: do {
          endIndex = part.text.indexOf(quote, index + 1);
          if (endIndex !== -1) {
            results.push({
              type: "string-literal",
              index,
              length: endIndex + 1 - index,
              quote,
            });
            index = endIndex;
            break inner;
          }
        } while (endIndex !== -1);
      }
    } while (index !== -1);
    return results;
  }, []);
}
