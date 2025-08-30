import { addMissingParentheses } from "./addMissingParentheses";
import { prettify } from "./prettify";

export function prettifyType(
  type: string,
  format: (type: string) => string,
  options?: { throwOnError?: boolean }
) {
  try {
    return convertToOriginalType(format(convertToValidType(type)));
  } catch (e) {
    if (options?.throwOnError) {
      throw e;
    }
    return type;
  }
}

const convertToValidType = (type: string) =>
  `type x = ${type
    .replace(/(.*)\.\.\.$/, (_, p1) => addMissingParentheses(p1))
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
    .replaceAll(/... (\d{0,}) more .../g, (_, p1) => `/* ${p1} more */`)
    .replace(/type x =[ ]?((.|\n)*);.*/g, "$1")
    .trim();

