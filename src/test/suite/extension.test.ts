import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import { addMissingParentheses } from "../../format/addMissingParentheses";
import { formatDiagnosticMessage } from "../../format/formatDiagnosticMessage";
import { inlineCodeBlock } from "../../components";
import { format } from "prettier";
// import * as myExtension from '../../extension';

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
      formatDiagnosticMessage("Type 'string' is not assignable to type '{ 'abc*bc': string; }'.", (text) => text),
      'Type ' +
      inlineCodeBlock('string', 'type') +
      ' is not assignable to type ' +
      inlineCodeBlock("{ 'abc*bc': string; }", 'type') +
      '.'
    );
  });
});
