export type ErrorMessageMocks =
  | 'errorWithSpecialCharsInObjectKeys'
  | 'errorWithDashInObjectKeys'
  | 'errorWithMethodsWordInIt'
  | 'errorWithParamsDestructuring'
  | 'errorWithLongType'
  | 'errorWithTruncatedType2'
  | 'errorWithSimpleIndentations'

export type TestSuites =
  | 'Test of adding missing parentheses'
  | 'Special characters in object keys'
  | "Special method's word in the error"
  | 'Formatting type with params destructuring should succeed'
