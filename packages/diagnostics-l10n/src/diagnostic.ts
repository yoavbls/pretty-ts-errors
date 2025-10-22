import type {
  DiagnosticMessageTemplate,
  TemplateParamPart,
  TemplatePart,
} from ".";

export type DiagnosticPart = DiagnosticTextPart | DiagnosticParamPart;

export interface DiagnosticTextPart {
  type: "text";
  text: string;
}

export interface DiagnosticParamPart {
  type: "param";
  identifier: number;
  argument: string;
}

/**
 * Rebuilds a diagnostic from a `DiagnosticPart[]`
 * @example
 * ```ts
 *
 * ```
 */
export function rebuildDiagnostic(parts: DiagnosticPart[]): string {
  return parts.reduce((string, part) => {
    if (part.type === "text") {
      string += part.text;
    } else {
      string += part.argument;
    }
    return string;
  }, "");
}

/**
 * Formats a diagnostic based on the given `DiagnosticMessageTemplate` and `params`.
 * @example
 * ```ts
 *
 * ```
 */
export function formatDiagnostic(
  template: DiagnosticMessageTemplate,
  params: string[]
) {
  return params.reduce((result, param, index) => {
    return result.replaceAll(`{${index}}`, param);
  }, template);
}

/**
 * Formats a diagnostic based on the given `DiagnosticPart[]` and `params`.
 * @example
 * ```ts
 *
 * ```
 */
export function formatDiagnosticFromDiagnosticParts(
  parts: DiagnosticPart[],
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

/**
 * Parses a `diagnostic` based on the given `templateParts` and returns a `DiagnosticPart[]`
 * @example
 * ```ts
 *
 * ```
 */
export function parseDiagnostic(
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
              `expected nextPart to be of type 'text', instead got 'param' with '{ identifier: ${nextPart.identifier}}'`
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
