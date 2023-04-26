import { format } from "prettier";
import { CodeBlock } from ".";
import { addMissingParentheses } from "./addMissingParentheses";

export function formatTypeBlock(
  prefix: string,
  type: string,
  codeBlock: CodeBlock
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

  const prettyType = prettifyType(type);

  if (prettyType.includes("\n")) {
    return `${prefix}: ${codeBlock(prettyType, "type", true)}`;
  } else {
    return `${prefix} ${codeBlock(prettyType, "type")}`;
  }
}
/**
 * Try to make type prettier with prettier
 */
export function prettifyType(
  type: string,
  options?: { throwOnError?: boolean }
) {
  try {
    // Wrap type with valid statement, format it and extract the type back
    return convertToOriginalType(
      format(convertToValidType(type), {
        parser: "typescript",
        printWidth: 60,
        singleAttributePerLine: false,
        arrowParens: "avoid",
      })
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
    .replaceAll(/... (\d{0,}) more .../g, (_, p1) => `/* ${p1} more */`) // ... x more ... not shown sell
    // .replaceAll(/\(param\: \/\* (\{ .* \}) \*\//g, (_, p1) => `(${p1}: `)
    .replace(/type x =[ ]?((.|\n)*);.*/g, "$1")
    .trim();
