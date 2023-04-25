import {
  ExtensionContext,
  languages,
  MarkdownString,
  Range,
  window,
  env
} from 'vscode'
import * as vscode from 'vscode'
import { createConverter } from 'vscode-languageclient/lib/common/codeConverter'
import { formatDiagnostic } from './format/formatDiagnostic'
import { prettify } from './format/prettify'
import { hoverProvider } from './provider/hoverProvider'
import { registerSelectedTextHoverProvider } from './provider/selectedTextHoverProvider'
import { uriStore } from './provider/uriStore'
import { has } from './utils'
import { getLocale } from './format/i18n/locales'

export function activate(context: ExtensionContext) {
  const registeredLanguages = new Set<string>()
  const converter = createConverter()
  const { regexes } = getLocale(env.language)

  registerSelectedTextHoverProvider(context)

  context.subscriptions.push(
    languages.onDidChangeDiagnostics(async (e) => {
      e.uris.forEach((uri) => {
        const diagnostics = languages.getDiagnostics(uri)

        const items: {
          range: Range
          contents: MarkdownString[]
        }[] = []

        let hasTsDiagnostic = false

        diagnostics
          .filter((diagnostic) =>
            diagnostic.source
              ? has(['ts', 'deno-ts', 'js'], diagnostic.source)
              : false
          )
          .forEach(async (diagnostic) => {
            // formatDiagnostic converts message based on LSP Diagnostic type, not VSCode Diagnostic type, so it can be used in other IDEs.
            // Here we convert VSCode Diagnostic to LSP Diagnostic to make formatDiagnostic recognize it.
            const markdownString = new MarkdownString(
              formatDiagnostic(
                converter.asDiagnostic(diagnostic),
                prettify,
                regexes
              )
            )

            markdownString.isTrusted = true
            markdownString.supportHtml = true

            items.push({
              range: diagnostic.range,
              contents: [markdownString]
            })
            hasTsDiagnostic = true
          })
        uriStore[uri.path] = items

        if (hasTsDiagnostic) {
          const editor = window.visibleTextEditors.find(
            (editor) => editor.document.uri.toString() === uri.toString()
          )
          if (editor && !registeredLanguages.has(editor.document.languageId)) {
            registeredLanguages.add(editor.document.languageId)
            context.subscriptions.push(
              languages.registerHoverProvider(
                {
                  language: editor.document.languageId
                },
                hoverProvider
              )
            )
          }
        }
      })
    })
  )
}
