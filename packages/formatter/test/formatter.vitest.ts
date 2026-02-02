import { describe, it, expect } from "vitest";
import { formatDiagnosticMessage } from "@pretty-ts-errors/formatter";
import { addMissingParentheses } from "@pretty-ts-errors/formatter/src/addMissingParentheses";
import { prettifyType } from "@pretty-ts-errors/formatter/src/formatTypeBlock";
import {
  inlineCodeBlock,
  multiLineCodeBlock,
} from "@pretty-ts-errors/vscode-formatter/src/components";
import { d } from "@pretty-ts-errors/utils";
import {
  errorWithDashInObjectKeys,
  errorWithSpecialCharsInObjectKeys,
} from "./errorMessageMocks";

describe("formatter", () => {
  it("adds missing parentheses", () => {
    expect(addMissingParentheses("Hello, {world! [This] is a (test.")).toBe(
      "Hello, {world! [This] is a (test.\n...)}"
    );
  });

  // Provide a codeBlock fn similar to the extension's renderer
  const htmlCodeBlock = (
    code: string,
    language?: string,
    multiLine?: boolean
  ) =>
    multiLine
      ? multiLineCodeBlock(code, language || "")
      : inlineCodeBlock(code, language || "");

  it("formats Special characters in object keys", () => {
    expect(
      formatDiagnosticMessage(errorWithSpecialCharsInObjectKeys, htmlCodeBlock)
    ).toBe(
      "Type " +
        inlineCodeBlock("string", "type") +
        " is not assignable to type " +
        inlineCodeBlock(`{ "abc*bc": string }`, "type") +
        "."
    );
  });

  it("prettifies truncated type", () => {
    expect(() =>
      prettifyType(
        d` { b: { name: string; icon: undefined; }; c: { name: string; icon: undefined; }; d: { name: string; icon: undefined; }; e: { name: string; icon: undefined; }; f: { ...; }; g: { ...; }; h:...`,
        { throwOnError: true }
      )
    ).not.toThrow();
  });

  it("formats method's word in the error", () => {
    expect(
      formatDiagnosticMessage(errorWithDashInObjectKeys, htmlCodeBlock)
    ).toBe(
      "Type " +
        inlineCodeBlock(`{ person: { "first-name": string } }`, "type") +
        " is not assignable to type " +
        inlineCodeBlock("string", "type") +
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
