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

describe("formatter", (context) => {
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

  it("formats missing-property diagnostics as a structured list", async () => {
    const result = await prettifyErrorMessage(
      "Type '{ email: \"usr@usr.io\"; }' is missing the following properties from type '{ name: string; email: `${string}@${string}.${string}`; age: number; address: { street: string; city: string; country: string; }; }': name, age, address"
    );

    expect(result).toContain(
      "is missing the following properties from type"
    );
    expect(result).toContain(
      "<ul><li>name</li><li>age</li><li>address</li></ul>"
    );
    expect(result).toContain("```type");
    expect(result).toContain("name: string");
    expect(result).toContain("street: string");
    expect(result).toContain("country: string");
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

  it("formats complex types with stronger wrapping and four-space indentation", async () => {
    const formatted = await formatType(
      d`{ user: { name: string; email: \`\${string}@\${string}.\${string}\`; age: number; address: { street: string; city: string; country: string; }; }; }`,
      { throwOnError: true }
    );

    expect(formatted).toContain("\n    user: {\n");
    expect(formatted).toContain("\n        name: string\n");
    expect(formatted).toContain("address: {\n");
  });

  it("prettifies truncated type", async () => {
    await expect(
      formatType(
        d` { b: { name: string; icon: undefined; }; c: { name: string; icon: undefined; }; d: { name: string; icon: undefined; }; e: { name: string; icon: undefined; }; f: { ...; }; g: { ...; }; h:...`,
        { throwOnError: true }
      )
    ).resolves.toBeTypeOf("string");
  });

  it.for(Object.entries(errorMessageMocks))(
    "prettifies mock error message: %s",
    async ([_name, message], { expect }) => {
      const prettified = await prettifyErrorMessage(message);
      expect(prettified).toBeTypeOf("string");
      expect(prettified).toMatchSnapshot();
    }
  );
});
