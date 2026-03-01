import { addMissingParentheses } from "./addMissingParentheses";
import { formatWithPrettier } from "./prettify";

export async function formatTypeBlock(
  prefix: string,
  type: string,
  codeBlock: (code: string, language?: string, multiLine?: boolean) => string
) {
  // Return a simple code block if it's just a parenthesis
  if (type.match(/^(\[\]|\{\})$/)) {
    return `${prefix} ${codeBlock(type)}`;
  }

  if (
    // Skip formatting if it's a simple type
    type.match(
      /^((void|null|undefined|any|number|string|bigint|symbol|readonly|typeof)(\[\])?)$/
    )
  ) {
    return `${prefix} ${codeBlock(type, "type")}`;
  }

  const formattedType = await formatType(type);

  if (formattedType.includes("\n")) {
    return `${prefix}: ${codeBlock(formattedType, "type", true)}`;
  } else {
    return `${prefix} ${codeBlock(formattedType, "type")}`;
  }
}
/**
 * Try to format type with prettier
 */
export async function formatType(
  type: string,
  options?: { throwOnError?: boolean }
) {
  try {
    // Wrap type with valid statement, format it and extract the type back
    return convertToOriginalType(
      await formatWithPrettier(convertToValidType(type))
    );
  } catch (e) {
    if (options?.throwOnError) {
      throw e;
    }
    return type;
  }
}

const convertToValidType = (type: string) =>
  `type x = ${type
    // Add missing parentheses when the type ends with "...""
    .replace(/(.*)\.\.\.$/, (_, p1) => addMissingParentheses(p1))
    // Replace single parameter function destructuring because it's not a valid type
    // .replaceAll(/\((\{.*\})\:/g, (_, p1) => `(param: /* ${p1} */`)
    // Change `(...): return` which is invalid to `(...) => return`
    .replace(/^(\(.*\)): /, (_, p1) => `${p1} =>`)
    .replaceAll(/... (\d{0,}) more .../g, (_, p1) => `___${p1}MORE___`)
    .replaceAll(/... (\d{0,}) more ...;/g, (_, p1) => `___MORE___: ${p1};`)
    .replaceAll("...;", "___KEY___: ___THREE_DOTS___;")
    .replaceAll("...", "__THREE_DOTS__")};`;

const convertToOriginalType = (type: string) =>
  type
    .replaceAll("___KEY___: ___THREE_DOTS___", "...;")
    .replaceAll("__THREE_DOTS__", "...")
    .replaceAll(/___MORE___: (\d{0,});/g, (_, p1) => `... ${p1} more ...;`)
    .replaceAll(/___(\d{0,})MORE___/g, (_, p1) => `... ${p1} more ...`)
    .replaceAll(/'([^']+)'(?=\s*:)/g, '"$1"')
    .replaceAll(/... (\d{0,}) more .../g, (_, p1) => `/* ${p1} more */`) // ... x more ... not shown sell
    // .replaceAll(/\(param\: \/\* (\{ .* \}) \*\//g, (_, p1) => `(${p1}: `)
    .replace(/^type x =[ ]?([\s\S]*?);?$/g, "$1")
    .trim();
