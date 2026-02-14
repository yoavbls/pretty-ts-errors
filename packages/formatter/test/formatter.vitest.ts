import { describe, it, expect } from "vitest";
import {
  formatDiagnosticMessage,
  type CodeBlockFn,
} from "@pretty-ts-errors/formatter";
import { addMissingParentheses } from "@pretty-ts-errors/formatter/src/addMissingParentheses";
import { prettifyType } from "@pretty-ts-errors/formatter/src/formatTypeBlock";
import { d } from "@pretty-ts-errors/utils";
import {
  errorWithDashInObjectKeys,
  errorWithSpecialCharsInObjectKeys,
} from "./errorMessageMocks";

// Simple stub that marks code blocks without any rendering logic
const stubCodeBlock: CodeBlockFn = (code, language, multiLine) => {
  if (multiLine) return `\n\`\`\`${language}\n${code}\n\`\`\`\n`;
  return `\`${code}\``;
};

describe("formatter", () => {
  it("adds missing parentheses", () => {
    expect(addMissingParentheses("Hello, {world! [This] is a (test.")).toBe(
      "Hello, {world! [This] is a (test.\n...)}"
    );
  });

  it("formats Special characters in object keys", () => {
    expect(
      formatDiagnosticMessage(errorWithSpecialCharsInObjectKeys, stubCodeBlock)
    ).toBe(
      "Type " +
        "`string`" +
        " is not assignable to type " +
        '`{ "abc*bc": string }`' +
        "."
    );
  });

  it("formats method's word in the error", () => {
    expect(
      formatDiagnosticMessage(errorWithDashInObjectKeys, stubCodeBlock)
    ).toBe(
      "Type " +
        '`{ person: { "first-name": string } }`' +
        " is not assignable to type " +
        "`string`" +
        "."
    );
  });

  it("prettifies type with params destructuring", () => {
    expect(() =>
      prettifyType(
        d` { $ref: null; ref: (ref: any) => any; columns: ({ label: string; prop: string; } | { label: string; formatter: ({ ip_type }: any) => any; } | { actions: { label: string; disabled: ({ contract_id }: any) => boolean; handler({ contract_id }: any): void; }[]; })[]; ... 4 more ...; load(): Promise<...>; }
        `,
        { throwOnError: true }
      )
    ).not.toThrow();
  });

  it("prettifies truncated type", () => {
    expect(() =>
      prettifyType(
        d` { b: { name: string; icon: undefined; }; c: { name: string; icon: undefined; }; d: { name: string; icon: undefined; }; e: { name: string; icon: undefined; }; f: { ...; }; g: { ...; }; h:...`,
        { throwOnError: true }
      )
    ).not.toThrow();
  });
});
