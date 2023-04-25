import { inlineCodeBlock } from '../../components'
import { ErrorMessageMocks, TestSuites } from '../../test/suite/types'
import { d } from '../../utils'
import { FormatDiagnosticMessageRules } from '../formatDiagnosticMessage'
import { Locale } from './locales'

const regexes: Record<FormatDiagnosticMessageRules, RegExp> = {
  DeclareModuleSnippet: /'(declare module )'(.*)';'/g,
  MissingPropsError:
    /(is missing the following properties from type .*: )(.+?)(?=and|$)/g,
  TypePairs: /(types) '(.*?)' and '(.*?)'[\.]?/gi,
  TypeAnnotationOptions: /type annotation must be '(.*?)' or '(.*?)'[\.]?/gi,
  Overloaded: /(Overload \d of \d), '(.*?)', /gi,
  SimpleStrings: /^'"[^"]*"'$/g,
  Types: /(.*)'([^>]*)' (type|interface|return type|file|module)/gi,
  ReversedTypes: /(.*)'([^>]*)' (type|interface|return type|file|module)/gi,
  SimpleTypesRest:
    /'((void|null|undefined|any|boolean|string|number|bigint|symbol)(\[\])?)'/g,
  TypescriptKeywords:
    /'(import|export|require|in|continue|break|let|false|true|const|new|throw|await|for await|[0-9]+)( ?.*?)'/g,
  ReturnValues: /(return|operator) '(.*?)'/gi,
  RegularCodeBlocks: /'(.*?)'/g
}

const testCase: Record<TestSuites, string> = {
  'Test of adding missing parentheses': 'Hello, {world! [This] is a (test.)}',

  'Special characters in object keys':
    'Type ' +
    inlineCodeBlock('string', 'type') +
    ' is not assignable to type ' +
    inlineCodeBlock(`{ "abc*bc": string }`, 'type') +
    '.',

  "Special method's word in the error":
    'Type ' +
    inlineCodeBlock(`{ person: { "first-name": string } }`, 'type') +
    ' is not assignable to type ' +
    inlineCodeBlock('string', 'type') +
    '.',

  'Formatting type with params destructuring should succeed': ''
}

const errorMessageMocks: Record<ErrorMessageMocks, string> = {
  errorWithSpecialCharsInObjectKeys: d`
Type 'string' is not assignable to type '{ 'abc*bc': string; }'.
`,
  errorWithDashInObjectKeys: d`
Type '{ person: { 'first-name': string; }; }' is not assignable to type 'string'.
`,
  errorWithMethodsWordInIt: d`
The 'this' context of type 'ElementHandle<Node>' is not assignable to method's 'this' of type 'ElementHandle<Element>'.
  Type 'Node' is missing the following properties from type 'Element': attributes, classList, className, clientHeight, and 114 more.
`,
  errorWithParamsDestructuring: d`
Argument of type '{ $ref: null; ref: (ref: any) => any; columns: ({ label: string; prop: string; } | { label: string; formatter: ({ ip_type }: any) => any; } | { actions: { label: string; disabled: ({ contract_id }: any) => boolean; handler({ contract_id }: any): void; }[]; })[]; ... 4 more ...; load(): Promise<...>; }' is not assignable to parameter of type 'VTableConfig'.
  Property 'data' is missing in type '{ $ref: null; ref: (ref: any) => any; columns: ({ label: string; prop: string; } | { label: string; formatter: ({ ip_type }: any) => any; } | { actions: { label: string; disabled: ({ contract_id }: any) => boolean; handler({ contract_id }: any): void; }[]; })[]; ... 4 more ...; load(): Promise<...>; }' but required in type 'VTableConfig'.
`,

  errorWithLongType: d`
Property 'isFlying' is missing in type '{ animal: { __typename?: "Animal" | undefined; id: string; name: string; age: number; isAlived: boolean; ... 8 more ...; attributes: { ...; } | ... 3 more ... | { ...; }; }; }' but required in type '{ animal: { __typename?: "Animal" | undefined; id: string; name: string; age: number; isAlived: boolean; isFlying: boolean; ... 8 more ...; attributes: { ...; } | ... 3 more ... | { ...; }; }; }'.
`,

  errorWithTruncatedType2: d`
Type '{ '!top': string[]; 'xsl:declaration': { attrs: { 'default-collation': null; 'exclude-result-prefixes': null; 'extension-element-prefixes': null; 'use-when': null; 'xpath-default-namespace': null; }; }; 'xsl:instruction': { ...; }; ... 49 more ...; 'xsl:literal-result-element': {}; }' is missing the following properties from type 'GraphQLSchema': description, extensions, astNode, extensionASTNodes, and 21 more.
`,

  errorWithSimpleIndentations: d`
Type '(newIds: number[]) => void' is not assignable to type '(selectedId: string[]) => void'.
  Types of parameters 'newIds' and 'selectedId' are incompatible.
    Type 'string[]' is not assignable to type 'number[]'.      
      Type 'string' is not assignable to type 'number'.
`
}

const en: Locale = {
  regexes,
  testCase,
  errorMessageMocks
}

export default en
