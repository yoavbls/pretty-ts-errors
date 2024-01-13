import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import { inlineCodeBlock } from "../../components";
import { addMissingParentheses } from "../../format/addMissingParentheses";
import { formatDiagnosticMessage } from "../../format/formatDiagnosticMessage";
import { prettifyType } from "../../format/formatTypeBlock";
import { prettify } from "../../format/prettify";
import { d } from "../../utils";
import {
  errorWithDashInObjectKeys,
  errorWithSpecialCharsInObjectKeys,
} from "./errorMessageMocks";

suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("Test of adding missing parentheses", () => {
    assert.strictEqual(
      addMissingParentheses("Hello, {world! [This] is a (test."),
      "Hello, {world! [This] is a (test.\n...)}"
    );
  });

  test("Special characters in object keys", () => {
    assert.strictEqual(
      formatDiagnosticMessage(errorWithSpecialCharsInObjectKeys, prettify),
      "Type " +
        inlineCodeBlock("string", "type") +
        " is not assignable to type " +
        inlineCodeBlock(`{ "abc*bc": string }`, "type") +
        "."
    );
  });

  test("Special method's word in the error", () => {
    assert.strictEqual(
      formatDiagnosticMessage(errorWithDashInObjectKeys, prettify),
      "Type " +
        inlineCodeBlock(`{ person: { "first-name": string } }`, "type") +
        " is not assignable to type " +
        inlineCodeBlock("string", "type") +
        "."
    );
  });

  test("Formatting type with params destructuring should succeed", () => {
    prettifyType(
      d` { $ref: null; ref: (ref: any) => any; columns: ({ label: string; prop: string; } | { label: string; formatter: ({ ip_type }: any) => any; } | { actions: { label: string; disabled: ({ contract_id }: any) => boolean; handler({ contract_id }: any): void; }[]; })[]; ... 4 more ...; load(): Promise<...>; }
    `,
      prettify,
      { throwOnError: true }
    );
  });

  test("Formatting truncated type should succeed", () => {
    prettifyType(
      d` { b: { name: string; icon: undefined; }; c: { name: string; icon: undefined; }; d: { name: string; icon: undefined; }; e: { name: string; icon: undefined; }; f: { ...; }; g: { ...; }; h:...`,
      prettify,
      { throwOnError: true }
    );
  });
});
