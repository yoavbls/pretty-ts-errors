import { FormatDiagnosticMessageRules } from '../formatDiagnosticMessage';

export const ko: Record<FormatDiagnosticMessageRules, RegExp> = {
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
};
