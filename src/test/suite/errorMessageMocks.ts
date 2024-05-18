import { d } from "../../utils";

/**
 * This file contains mocks of error messages, only some of them
 * are used in tests but all of them can be used to test and debug
 * the formatting visually, you can try to select them on debug and check the hover.
 */

export const errorWithSpecialCharsInObjectKeys = d`
Type 'string' is not assignable to type '{ 'abc*bc': string; }'.
`;

export const errorWithDashInObjectKeys = d`
Type '{ person: { 'first-name': string; }; }' is not assignable to type 'string'.
`;

/**
 * Formatting error from this issue: https://github.com/yoavbls/pretty-ts-errors/issues/20
 */
export const errorWithMethodsWordInIt = d`
The 'this' context of type 'ElementHandle<Node>' is not assignable to method's 'this' of type 'ElementHandle<Element>'.
  Type 'Node' is missing the following properties from type 'Element': attributes, classList, className, clientHeight, and 114 more.
`;

const errorWithParamsDestructuring = d`
Argument of type '{ $ref: null; ref: (ref: any) => any; columns: ({ label: string; prop: string; } | { label: string; formatter: ({ ip_type }: any) => any; } | { actions: { label: string; disabled: ({ contract_id }: any) => boolean; handler({ contract_id }: any): void; }[]; })[]; ... 4 more ...; load(): Promise<...>; }' is not assignable to parameter of type 'VTableConfig'.
  Property 'data' is missing in type '{ $ref: null; ref: (ref: any) => any; columns: ({ label: string; prop: string; } | { label: string; formatter: ({ ip_type }: any) => any; } | { actions: { label: string; disabled: ({ contract_id }: any) => boolean; handler({ contract_id }: any): void; }[]; })[]; ... 4 more ...; load(): Promise<...>; }' but required in type 'VTableConfig'.
`;

const errorWithLongType = d`
Property 'isFlying' is missing in type '{ animal: { __typename?: "Animal" | undefined; id: string; name: string; age: number; isAlived: boolean; ... 8 more ...; attributes: { ...; } | ... 3 more ... | { ...; }; }; }' but required in type '{ animal: { __typename?: "Animal" | undefined; id: string; name: string; age: number; isAlived: boolean; isFlying: boolean; ... 8 more ...; attributes: { ...; } | ... 3 more ... | { ...; }; }; }'.
`;

const errorWithTruncatedType2 = d`
Type '{ '!top': string[]; 'xsl:declaration': { attrs: { 'default-collation': null; 'exclude-result-prefixes': null; 'extension-element-prefixes': null; 'use-when': null; 'xpath-default-namespace': null; }; }; 'xsl:instruction': { ...; }; ... 49 more ...; 'xsl:literal-result-element': {}; }' is missing the following properties from type 'GraphQLSchema': description, extensions, astNode, extensionASTNodes, and 21 more.
`;

const variableNotUsedEror = d`
'a' is declared but its value is never read.
`;

const errorWithSimpleIndentations = d`
Type '(newIds: number[]) => void' is not assignable to type '(selectedId: string[]) => void'.
  Types of parameters 'newIds' and 'selectedId' are incompatible.
    Type 'string[]' is not assignable to type 'number[]'.
      Type 'string' is not assignable to type 'number'.
`;

const errorWithComma = d`
Argument of type '{ filters: Filters; } & T' is not assignable to parameter of type 'T & F'.
  Type '{ filters: Filters; } & T' is not assignable to type 'F'.
    '{ filters: Filters; } & T' is assignable to the constraint of type 'F', but 'F' could be instantiated with a different subtype of constraint '{ filters: Filters; }'.
`;

const missingPropertyError =
  "\
Property 'user' is missing in type '{ person: { username: string; email: string; }; }' but required in type '{ user: { name: string; email: `${string}@${string}.${string}`; age: number; }; }'.\
";

const missingReactPropsError = d`
Type '{ style: { backgroundColor: string; }; }' is not assignable to type 'DropDownPickerProps<Object>'.
  Type '{ style: { backgroundColor: string; }; }' is not assignable to type 'DropDownPickerMultipleProps<Object> & DropDownPickerBaseProps<Object›'.
    Type '{ style: { backgroundColor: string; }; }' is missing the following properties from type 'DropDownPickerMultipleProps<Object>': multiple, setValue, value
`;

const leftSideAritmeticError = d`
The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.
`;

const theosError = d`
Exported variable 'uploadRouter' has or is using name 'Uploader' from external module "/Users/theo/Code/Work/filething/packages/uploadthing/dist/types-dbaf1b46" but cannot be named.
`;

const ts1378Error = d`
Top-level 'await' expressions are only allowed when the 'module' option is set to 'es2022', 'esnext', 'system', 'node16', or 'nodenext', and the 'target' option is set to 'es2017' or higher.
`;

const ts2304Error = d`
Cannot find name 'varname'.
`;

const ts2305Error = d`
Module '"@pretty-ts-errors/formatter"' has no exported member 'values'.
`;

const ts2307Error = d`
Cannot find module 'events' or its corresponding type declarations.
`;

const ts1360Error = d`
Property 'a' is missing in type '{ b: { name: string; icon: undefined; }; c: { name: string; icon: undefined; }; d: { name: string; icon: undefined; }; e: { name: string; icon: undefined; }; f: { ...; }; g: { ...; }; h:...' but required in type '{a: {name: string; icon: undefined}}'.
`;

const errorWithStringChars = d`
Type '"' 'Oh no"' is not assignable to type '"'  'Oh n\"o\"'   "'.
`;

const ts2322ErrorWithPrivateProperty = d`
Type 'Ref<{ name: string; readonly type: "json"; mm: <T extends Convertible = Convertible>(px: T) => T; px: <T extends Convertible = Convertible>(mm: T) => T; ... 18 more ...; toJson: () => string; }>' is not assignable to type 'Ref<MpcdiConfiguration>'.
  Type '{ name: string; readonly type: "json"; mm: <T extends Convertible = Convertible>(px: T) => T; px: <T extends Convertible = Convertible>(mm: T) => T; ... 18 more ...; toJson: () => string; }' is missing the following properties from type 'MpcdiConfiguration': ratio, #overlaps, download
`;
