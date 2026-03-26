import { describe, it, expect } from "vitest";
import {
  createErrorMessagePrettifier,
  type CodeBlockFn,
} from "../src/errorMessagePrettifier";
import { addMissingParentheses } from "../src/addMissingParentheses";
import { formatType } from "../src/formatTypeBlock";
import { d } from "@pretty-ts-errors/utils";
import {
  errorWithDashInObjectKeys,
  errorWithSpecialCharsInObjectKeys,
} from "./errorMessageMocks";
import * as errorMessageMocks from "./errorMessageMocks";

// Simple stub that marks code blocks without any rendering logic
const stubCodeBlock: CodeBlockFn = (code, language, multiLine) => {
  if (multiLine) return `\n\`\`\`${language}\n${code}\n\`\`\`\n`;
  return `\`${code}\``;
};

const prettifyErrorMessage = createErrorMessagePrettifier(stubCodeBlock);

describe("formatter", () => {
  it("adds missing parentheses", () => {
    expect(addMissingParentheses("Hello, {world! [This] is a (test.")).toBe(
      "Hello, {world! [This] is a (test.\n...)}"
    );
  });

  it("formats Special characters in object keys", async () => {
    expect(await prettifyErrorMessage(errorWithSpecialCharsInObjectKeys)).toBe(
      'Type `string` is not assignable to type `{ "abc*bc": string }`.'
    );
  });

  it("formats method's word in the error", async () => {
    expect(await prettifyErrorMessage(errorWithDashInObjectKeys)).toBe(
      'Type `{ person: { "first-name": string } }` is not assignable to type `string`.'
    );
  });

  it("prettifies type with params destructuring", async () => {
    await expect(
      formatType(
        d` { $ref: null; ref: (ref: any) => any; columns: ({ label: string; prop: string; } | { label: string; formatter: ({ ip_type }: any) => any; } | { actions: { label: string; disabled: ({ contract_id }: any) => boolean; handler({ contract_id }: any): void; }[]; })[]; ... 4 more ...; load(): Promise<...>; }
        `,
        { throwOnError: true }
      )
    ).resolves.toBeTypeOf("string");
  });

  it("prettifies truncated type", async () => {
    await expect(
      formatType(
        d` { b: { name: string; icon: undefined; }; c: { name: string; icon: undefined; }; d: { name: string; icon: undefined; }; e: { name: string; icon: undefined; }; f: { ...; }; g: { ...; }; h:...`,
        { throwOnError: true }
      )
    ).resolves.toBeTypeOf("string");
  });

  it.each(Object.entries(errorMessageMocks))(
    "prettifies mock error message: %s",
    async (_name, message) => {
      await expect(prettifyErrorMessage(message)).resolves.toBeTypeOf("string");
    }
  );
});
