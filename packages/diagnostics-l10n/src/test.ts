import type { DiagnosticMessageTemplate } from "./index.js";
import { load } from "./load.js";

type TemplatePart = TemplateTextPart | TemplateParamPart;

interface TemplateTextPart {
  type: "text";
  text: string;
}

interface TemplateParamPart {
  type: "param";
  /**
   * The index at which the parameter is found in the template string
   */
  index: number;
  /**
   * The number indicating which printf argument it represents
   * `Type '{0}' is not assignable to type '{1}'` -> template will have 2 parameters with identifier 0 and 1
   */
  identifier: number;
}

interface ParseDiagnosticResult {
  parts: DiagnosticPart[];
}

type DiagnosticPart = DiagnosticTextPart | DiagnosticParamPart;

interface DiagnosticTextPart {
  type: "text";
  text: string;
}

interface DiagnosticParamPart {
  type: "param";
  identifier: number;
  argument: string;
}

/**
 * Parses a `DiagnosticMessageTemplate` into a `TemplatePart[]`
 * @example
 * ```ts
 * const template = 'El tipo '{0}' no se puede asignar al tipo '{1}'';
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
function parseTemplate(template: DiagnosticMessageTemplate): TemplatePart[] {
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
        index,
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
 * Use `String.prototype[symbol.iterator]` to split the string into characters
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/length#strings_with_length_not_equal_to_the_number_of_characters
 */
function toCharacters(string: string) {
  return [...string];
}

function parseDiagnostic(
  templateParts: TemplatePart[],
  diagnostic: string
): DiagnosticPart[] {
  const parts: DiagnosticPart[] = [];
  // simple lookup for parameters that occur more than once in a template
  const lookup: Record<TemplateParamPart["identifier"], DiagnosticParamPart> =
    {};
  for (let index = 0; index < templateParts.length; index++) {
    const templatePart = templateParts[index];
    switch (templatePart.type) {
      case "text": {
        if (!diagnostic.startsWith(templatePart.text)) {
          throw new Error(
            `expected diagnostic '${diagnostic}' to start with '${templatePart.text}'`
          );
        }
        diagnostic = diagnostic.substring(templatePart.text.length);
        parts.push(templatePart);
        continue;
      }
      case "param": {
        const hit = lookup[templatePart.identifier];
        if (hit) {
          diagnostic = diagnostic.substring(hit.argument.length);
          parts.push(hit);
          continue;
        }
        // NOTE: we assume either a text part or the end of the string always follows a param part
        const nextPart = templateParts[index + 1];
        const part: DiagnosticParamPart = {
          type: "param",
          identifier: templatePart.identifier,
          // if there is no next part, the argument is whatever is left of the diagnostic
          argument: diagnostic,
        };
        if (nextPart) {
          if (nextPart.type === "param") {
            throw new Error(
              `expected nextPart to be of type 'text', instead got 'param' with '{ identifier: ${nextPart.identifier}, index: ${nextPart.index}}'`
            );
          }
          const indexOfNextPart = diagnostic.indexOf(nextPart.text);
          part.argument = diagnostic.slice(0, indexOfNextPart);
          diagnostic = diagnostic.substring(indexOfNextPart);
          // cache the param to simplify arguments that are repeated
          lookup[templatePart.identifier] = part;
        }
        parts.push(part);
        continue;
      }
    }
  }
  return parts;
}

function formatDiagnostic(
  template: DiagnosticMessageTemplate,
  params: string[]
) {
  return params.reduce((template, param, index) => {
    return template.replaceAll(`{${index}}`, param);
  }, template);
}

function rebuildTemplate(parts: TemplatePart[]): string {
  return parts.reduce((string, part) => {
    if (part.type === "text") {
      string += part.text;
    } else {
      string += `{${part.identifier}}`;
    }
    return string;
  }, "");
}

function rebuildDiagnostic(parts: DiagnosticPart[]): string {
  return parts.reduce((string, part) => {
    if (part.type === "text") {
      string += part.text;
    } else {
      string += part.argument;
    }
    return string;
  }, "");
}

async function main() {
  const code = 2322;
  const params = ["$1", "$2", "$3", "$4", "$5"];

  const locales = [
    "cs",
    "de",
    "es",
    "fr",
    "it",
    "ja",
    "ko",
    "pl",
    "pt-br",
    "ru",
    "tr",
    "zh-cn",
    "zh-tw",
  ];

  locales.reduce(async (promise, locale) => {
    await promise;
    const map = await load(locale);
    Object.entries(map).map(([_, template]) => {
      const diagnostic = formatDiagnostic(template, params);
      const templateParts = parseTemplate(template);
      const templateMatches = rebuildTemplate(templateParts) === template;
      const diagnosticParts = parseDiagnostic(templateParts, diagnostic);
      const diagnosticMatches =
        rebuildDiagnostic(diagnosticParts) === diagnostic;
      console.log({
        locale,
        template,
        diagnostic,
        params,
        templateParts,
        templateMatches,
        diagnosticParts,
        diagnosticMatches,
      });
    });
  }, Promise.resolve());
}

main();
