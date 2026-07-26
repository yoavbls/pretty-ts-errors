import { describe, expect, it } from "vitest";
import type { Diagnostic } from "vscode-languageserver-types";
import { getDiagnosticCacheKey } from "../src";

const diagnostic: Diagnostic = {
  message: "Type 'Person' is not assignable to type 'Person'",
  range: {
    start: { line: 1, character: 2 },
    end: { line: 1, character: 8 },
  },
  code: 2322,
  relatedInformation: [
    {
      message: "'Person' is declared here.",
      location: {
        uri: "file:///person.ts",
        range: {
          start: { line: 3, character: 4 },
          end: { line: 3, character: 10 },
        },
      },
    },
  ],
};

describe("getDiagnosticCacheKey", () => {
  it("reuses the key for identical diagnostics", () => {
    const identicalDiagnostic: Diagnostic = {
      relatedInformation: diagnostic.relatedInformation,
      code: diagnostic.code,
      range: diagnostic.range,
      message: diagnostic.message,
    };

    expect(getDiagnosticCacheKey(identicalDiagnostic)).toBe(
      getDiagnosticCacheKey(diagnostic)
    );
  });

  it.each([
    {
      field: "range",
      changedDiagnostic: {
        ...diagnostic,
        range: {
          ...diagnostic.range,
          start: { line: 2, character: 2 },
        },
      },
    },
    {
      field: "code",
      changedDiagnostic: {
        ...diagnostic,
        code: 2345,
      },
    },
    {
      field: "related information URI",
      changedDiagnostic: {
        ...diagnostic,
        relatedInformation: [
          {
            ...diagnostic.relatedInformation![0]!,
            location: {
              ...diagnostic.relatedInformation![0]!.location,
              uri: "file:///another-person.ts",
            },
          },
        ],
      },
    },
  ])(
    "does not collide when only the $field differs",
    ({ changedDiagnostic }) => {
      expect(getDiagnosticCacheKey(changedDiagnostic)).not.toBe(
        getDiagnosticCacheKey(diagnostic)
      );
    }
  );
});
