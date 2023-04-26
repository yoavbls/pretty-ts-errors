import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import { formatDiagnosticMessage } from "formatter";
import { addMissingParentheses } from "formatter/src/addMissingParentheses";
import { prettifyType } from "formatter/src/formatTypeBlock";
import * as vscode from "vscode";
import { inlineCodeBlock } from "../../components";
import { d } from "../../deps";
import { prettify } from "../../format/prettify";
import {
  errorWithDashInObjectKeys,
  errorWithSpecialCharsInObjectKeys,
} from "./errorMessageMocks";

suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("Test of adding missing parentheses", () => {
    assert.strictEqual(
      addMissingParentheses("Hello, {world! [This] is a (test."),
      "Hello, {world! [This] is a (test.)}"
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
      { throwOnError: true }
    );
  });
});
