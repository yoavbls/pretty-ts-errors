import type { Diagnostic, Range } from "vscode-languageserver-types";

function serializeRange(range: Range) {
  return [
    range.start.line,
    range.start.character,
    range.end.line,
    range.end.character,
  ];
}

/**
 * Creates a stable cache key from every diagnostic field used by the formatter.
 */
export function getDiagnosticCacheKey(diagnostic: Diagnostic): string {
  return JSON.stringify([
    diagnostic.message,
    serializeRange(diagnostic.range),
    diagnostic.code,
    (diagnostic.relatedInformation ?? []).map((information) => [
      information.message,
      information.location.uri,
      serializeRange(information.location.range),
    ]),
  ]);
}
