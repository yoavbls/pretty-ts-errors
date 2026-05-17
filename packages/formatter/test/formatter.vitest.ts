import { describe, it, expect } from "vitest";
import {
  createErrorMessagePrettifier,
  type CodeBlockFn,
} from "../src/errorMessagePrettifier";
import { performance } from "node:perf_hooks";
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

  it("adds missing parentheses without pathological backtracking", () => {
    const startedAt = performance.now();
    const result = addMissingParentheses("(:".repeat(38730));

    expect(result).toBeTypeOf("string");
    expect(performance.now() - startedAt).toBeLessThan(2000);
  });

  it("prettifies malformed quote-heavy messages without pathological backtracking", async () => {
    const inputs = [
      "\\" + "\t'\"\t".repeat(27387) + "\n",
      ";'declare module ”".repeat(12910) + ";”\n'declare module '“;'",
      "is missing the following properties from type's".repeat(6382) + "\n",
      "TYPES “".repeat(20702) + "'\nTYPES “” AND ''",
      "TYPE ANNOTATION MUST BE “".repeat(10955) + "'",
      "OVERLOAD 0 OF 0, “".repeat(12910) + "\nOVERLOAD 0 OF 0, '', ",
      " " + 'FILE "P'.repeat(20702) + "\n",
      "E" + "MTYPE 'R".repeat(19365) + "\n",
      " FILE“".repeat(22361) + " FILE",
      "'0" + "0".repeat(54773) + "\n“0”",
      "RETURN “".repeat(19365) + "\nRETURN '”",
      "'" + "'0'0\0".repeat(24503) + "\n",
    ];

    const startedAt = performance.now();
    for (const input of inputs) {
      await expect(prettifyErrorMessage(input)).resolves.toBeTypeOf("string");
    }

    expect(performance.now() - startedAt).toBeLessThan(2000);
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

  it.for(Object.entries(errorMessageMocks))(
    "prettifies mock error message: %s",
    async ([_name, message], { expect }) => {
      const prettified = await prettifyErrorMessage(message);
      expect(prettified).toBeTypeOf("string");
      expect(prettified).toMatchSnapshot();
    }
  );
});
