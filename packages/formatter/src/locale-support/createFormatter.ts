import {
  parseDiagnostic,
  parseTemplate,
  type LocalizedDiagnosticeMessageMap,
  TemplateTextPart,
} from "@pretty-ts-errors/diagnostics-l10n";

interface Diagnostic {
  code: number;
  message: string;
}

type FormatterFn = (diagnostic: Diagnostic) => string;

/**
 * Some templates already use ` backticks, whereas other locales have the same template with different quotes
 */
const templateTransforms = {
  /**
   * There are 4 error codes with a `{ "key": "value" }` snippet, the surrounding quotes/backticks vary per locale
   */
  jsonKeyValuePart: [1480, 1481, 5101, 5107],
  declareModule: [7035, 7058],
  isMissingTheFollowingPropertiesFromType: [2739, 2740],
  typePair: [2202, 2203, 2204, 2205, 2319, 2320, 2321, 2365, 2367, 2859],
  typeAnnotationMustBeAnyOrUnknown: [1196],
  overloadOf: [2772],
  simpleStrings: [],
  moduleX: [],
  stringTypes: [],
  types: [],
  reverseTypes: [],
  simpleTypes: [],
  keywords: [],
  returnOrOperator: [],
  codeBlocks: [],
};

const parameterTransforms = {
  /**
   * Some parameters `'{0}'` are replaced with `{0}` => `"some string value"` resulting in `'"some string value"'`
   * These should be transformed to `<code>"some string value"</code>`
   * ```type
   * Module '"@pretty-ts-errors/formatter"' has no exported member 'values'.
   * ```
   */
  stringLiterals: [],
};

export function createFormatter(
  messageMap: LocalizedDiagnosticeMessageMap
): FormatterFn {
  function parseIntoDiagnosticParts(diagnostic: Diagnostic) {
    const template = messageMap[diagnostic.code];
    const templateParts = template
      ? parseTemplate(template)
      : createFallbackTemplateParts(diagnostic);
    const diagnosticParts = parseDiagnostic(templateParts, diagnostic.message);
    return diagnosticParts;
  }

  function formatDiagnosticMessage(diagnostic: Diagnostic): string {
    const parts = parseIntoDiagnosticParts(diagnostic);
  }

  return formatDiagnosticMessage;
}

function createFallbackTemplateParts(
  diagnostic: Diagnostic
): [TemplateTextPart] {
  return [{ type: "text", text: diagnostic.message }];
}
