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

  it("adds missing function return types", () => {
    expect(addMissingParentheses("(ref: any)")).toBe("(ref: any) => ...\n...");
  });

  it("handles adversarial missing-parentheses parameter patterns without catastrophic backtracking", () => {
    const message = "(:".repeat(40_000);

    expect(addMissingParentheses(message)).toContain(" => ...");
  }, 2_000);

  it("handles adversarial formatter patterns without catastrophic backtracking", async () => {
    const repeat = 5_000;
    const messages = [
      "\\" + "\t'\"\t".repeat(repeat) + "\n",
      ";'declare module ”".repeat(repeat) + ";”\n'declare module '“;'",
      "is missing the following properties from type's".repeat(repeat) + "\n",
      "TYPES “".repeat(repeat) + "'\nTYPES “” AND ''",
      "TYPE ANNOTATION MUST BE “".repeat(repeat) + "'",
      "OVERLOAD 0 OF 0, “".repeat(repeat) + "\nOVERLOAD 0 OF 0, '', ",
      " " + 'FILE "P'.repeat(repeat) + "\n",
      "E" + "MTYPE 'R".repeat(repeat) + "\n",
      " FILE“".repeat(repeat) + " FILE",
      "'0" + "0".repeat(repeat) + "\n“0”",
      "RETURN “".repeat(repeat) + "\nRETURN '”",
      "'" + "'0'0\x00".repeat(repeat) + "\n",
    ];

    for (const message of messages) {
      await expect(prettifyErrorMessage(message)).resolves.toBeTypeOf("string");
    }
  }, 2_000);

  it("does not prettify quoted string literals across line breaks", async () => {
    const message = "Type '\"first\nsecond\"' remains unjoined.";

    expect(await prettifyErrorMessage(message)).toContain(
      "'\"first\nsecond\"' remains"
    );
  });

  it("preserves text after quoted string literal replacements", async () => {
    await expect(
      prettifyErrorMessage(`Type '"' 'Oh no"' is not assignable.`)
    ).resolves.toContain("`\"' 'Oh no\"` is not assignable");
  });

  it("formats double-quoted module names containing apostrophes", async () => {
    await expect(
      prettifyErrorMessage(
        `Cannot find module "C:/Users/O'Connor/project/file.ts" or its corresponding type declarations.`
      )
    ).resolves.toBe(
      `Cannot find module \`"C:/Users/O'Connor/project/file.ts"\` or its corresponding type declarations.`
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

  it.for(Object.entries(errorMessageMocks))(
    "prettifies mock error message: %s",
    async ([_name, message], { expect }) => {
      const prettified = await prettifyErrorMessage(message);
      expect(prettified).toBeTypeOf("string");
      expect(prettified).toMatchSnapshot();
    }
  );
});
