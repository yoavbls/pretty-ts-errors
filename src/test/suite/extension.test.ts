import * as assert from 'assert'

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode'
import { addMissingParentheses } from '../../format/addMissingParentheses'
import { formatDiagnosticMessage } from '../../format/formatDiagnosticMessage'
import { prettifyType } from '../../format/formatTypeBlock'
import { prettify } from '../../format/prettify'
import { d } from '../../utils'
import { getLocale } from '../../format/i18n/locales'

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.')
  const { regexes, testCase, errorMessageMocks } = getLocale(
    vscode.env.language
  )

  test('Test of adding missing parentheses', () => {
    assert.strictEqual(
      addMissingParentheses('Hello, {world! [This] is a (test.'),
      testCase['Test of adding missing parentheses']
    )
  })

  test('Special characters in object keys', () => {
    assert.strictEqual(
      formatDiagnosticMessage(
        errorMessageMocks['errorWithSpecialCharsInObjectKeys'],
        prettify,
        regexes
      ),
      testCase['Special characters in object keys']
    )
  })

  test("Special method's word in the error", () => {
    assert.strictEqual(
      formatDiagnosticMessage(
        errorMessageMocks['errorWithDashInObjectKeys'],
        prettify,
        regexes
      ),
      testCase["Special method's word in the error"]
    )
  })

  test('Formatting type with params destructuring should succeed', () => {
    prettifyType(
      d` { $ref: null; ref: (ref: any) => any; columns: ({ label: string; prop: string; } | { label: string; formatter: ({ ip_type }: any) => any; } | { actions: { label: string; disabled: ({ contract_id }: any) => boolean; handler({ contract_id }: any): void; }[]; })[]; ... 4 more ...; load(): Promise<...>; }
    `,
      prettify,
      { throwOnError: true }
    )
  })
})
