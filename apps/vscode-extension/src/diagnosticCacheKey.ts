import type {
  Diagnostic,
  DiagnosticRelatedInformation,
} from "vscode-languageserver-types";

export function getDiagnosticCacheKey(diagnostic: Diagnostic): string {
  return JSON.stringify({
    message: diagnostic.message,
    code: diagnostic.code,
    range: diagnostic.range,
    relatedInformation:
      diagnostic.relatedInformation?.map(getRelatedInformationCacheKey) ?? [],
  });
}

function getRelatedInformationCacheKey({
  location,
  message,
}: DiagnosticRelatedInformation) {
  return {
    message,
    location: {
      uri: location.uri,
      range: location.range,
    },
  };
}
