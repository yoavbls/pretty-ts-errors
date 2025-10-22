import type { DiagnosticMessageTemplate } from "./index.js";

export type TemplatePart = TemplateTextPart | TemplateParamPart;

/**
 * Represents a text part of a `DiagnosticMessageTemplate`
 * @example
 * ```ts
 * const template = `Type '{0}' is not assignable to type '{1}'.`
 * // -> "Type '"
 * // -> "' is not assignable to type '"
 * // -> "'."
 * ```
 */
export interface TemplateTextPart {
  type: "text";
  text: string;
}

/**
 * Represents a parameter part of a `DiagnosticMessageTemplate`
 * @example
 * ```ts
 *
 * ```
 */
export interface TemplateParamPart {
  type: "param";
  /**
   * The number indicating which argument it represents in the `DiagnosticMessageTemplate`
   * @example
   * ```ts
   * const template = `Type '{0}' is not assignable to type '{1}'.`
   * // -> `0`
   * // -> `1`
   * ```
   */
  identifier: number;
}

/**
 * Use `String.prototype[symbol.iterator]` to split the string into characters
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/length#strings_with_length_not_equal_to_the_number_of_characters
 */
function toCharacters(string: string) {
  return [...string];
}

/**
 * Parses a `DiagnosticMessageTemplate` into a `TemplatePart[]`
 * @example
 * ```ts
 * const template = 'Type '{0}' is not assignable to type '{1}'.';
 * const parts = parseTemplate(template);
 * console.log(parts);
 * // [
 * //  { type: 'text', text: "Type '" },
 * //  { type: 'param', index: 6, identifier: 0 },
 * //  { type: 'text', text: "}' is not assignable to type '" },
 * //  { type: 'param', index: 30, identifier: 1 },
 * //  { type: 'text', text: "}'." }
 * // ]
 * ```
 */
export function parseTemplate(
  template: DiagnosticMessageTemplate
): TemplatePart[] {
  let characters = toCharacters(template);
  const parts: TemplatePart[] = [];

  let index = 0;
  while (index < characters.length) {
    // check for /{[01234]}/ like pattern
    // when opening brace is found
    const char = characters[index];
    match: if (char && char === "{") {
      const closingBrace = characters[index + 2];
      if (closingBrace && closingBrace !== "}") {
        break match;
      }
      const identifier = characters[index + 1];
      if (!identifier || !["0", "1", "2", "3", "4"].includes(identifier)) {
        break match;
      }
      // get the string part up until the match
      const text = characters.slice(0, index).join("");
      parts.push({
        type: "text",
        text,
      });
      parts.push({
        type: "param",
        identifier: Number(identifier),
      });
      // slice the match of the template string
      characters = characters.slice(index + 3);
      index = -1;
    }
    index++;
  }

  // if the template still has characters, its the final text part of the template
  if (characters.length) {
    parts.push({
      type: "text",
      text: characters.join(""),
    });
  }

  return parts;
}

/**
 * Rebuild a `DiagnosticMessageTemplate` from a `TemplatePart[]`
 * @example
 * ```ts
 *
 * ```
 */
export function rebuildTemplate(
  parts: TemplatePart[]
): DiagnosticMessageTemplate {
  return parts.reduce((string, part) => {
    if (part.type === "text") {
      string += part.text;
    } else {
      string += `{${part.identifier}}`;
    }
    return string;
  }, "");
}

/**
 * Rebuild a `DiagnosticMessageTemplate` from given a `TemplatePart[]` and `params`
 */
export function formatDiagnosticFromTemplateParts(
  parts: TemplatePart[],
  params: string[]
): string {
  return parts.reduce((result, part) => {
    if (part.type === "text") {
      result += part.text;
    } else {
      result += params[part.identifier];
    }
    return result;
  }, "");
}
