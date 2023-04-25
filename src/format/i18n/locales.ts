import { ErrorMessageMocks, TestSuites } from '../../test/suite/types'
import { FormatDiagnosticMessageRules } from '../formatDiagnosticMessage'
import en from './en'
import ko from './ko'

const supportedLocales = ['en', 'ko'] as const
export type SupportedLocales = (typeof supportedLocales)[number]

export type Locale = {
  regexes: Record<FormatDiagnosticMessageRules, RegExp>
  testCase: Record<TestSuites, string>
  errorMessageMocks: Record<ErrorMessageMocks, string>
}

export function getLocale(locale: string) {
  switch (locale) {
    case 'ko':
      return ko
    case 'en':
    default:
      return en
  }
}
