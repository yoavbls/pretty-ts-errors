import { strict as assert } from "node:assert";
import type { Diagnostic } from "vscode-languageserver-types";
import { getDiagnosticCacheKey } from "../../diagnosticCacheKey";

suite("getDiagnosticCacheKey", () => {
  test("distinguishes duplicate messages that link to different symbols", () => {
    const firstKey = getDiagnosticCacheKey(
      diagnosticWithRelatedInformation("file:///workspace/example.ts", 1)
    );
    const secondKey = getDiagnosticCacheKey(
      diagnosticWithRelatedInformation("file:///workspace/other.ts", 1)
    );

    assert.notEqual(firstKey, secondKey);
  });

  test("distinguishes duplicate messages at different ranges", () => {
    const firstKey = getDiagnosticCacheKey(
      diagnosticWithRelatedInformation("file:///workspace/example.ts", 1)
    );
    const secondKey = getDiagnosticCacheKey(
      diagnosticWithRelatedInformation("file:///workspace/example.ts", 8)
    );

    assert.notEqual(firstKey, secondKey);
  });
});

function diagnosticWithRelatedInformation(
  symbolUri: string,
  startCharacter: number
): Diagnostic {
  return {
    message: "Cannot find name 'Person'.",
    code: 2304,
    range: {
      start: { line: 0, character: startCharacter },
      end: { line: 0, character: startCharacter + 6 },
    },
    relatedInformation: [
      {
        message: "'Person' is declared here.",
        location: {
          uri: symbolUri,
          range: {
            start: { line: 3, character: 12 },
            end: { line: 3, character: 18 },
          },
        },
      },
    ],
  };
}
