import { format } from "prettier";
import {
  inlineCodeBlock,
  multiLineCodeBlock,
  unstyledCodeBlock,
} from "../components/codeBlock";

export const prettyType = (prefix: string, type: string) => {
  if (type.match(/^(\[\]|\{\})$/)) {
    return `${prefix} ${unstyledCodeBlock(type)}`;
  }

  if (
    type.match(
      /^((void|null|undefined|any|number|string|bigint|symbol|readonly|typeof)(\[\])?)$/
    )
  ) {
    return `${prefix} ${inlineCodeBlock(type, "type")}`;
  }

  let prettyType: string;
  // Wrap type with valid statement, format it and extract the type back
  try {
    prettyType = convertToOriginalType(
      format(convertToValidType(type), {
        parser: "typescript",
        printWidth: 60,
      })
    );
  } catch (e) {
    return unstyledCodeBlock(type);
  }

  if (prettyType.includes("\n")) {
    return `${prefix}: ${multiLineCodeBlock(prettyType, "type")}`;
  } else {
    return `${prefix} ${inlineCodeBlock(prettyType, "type")}`;
  }
};

const convertToValidType = (type: string) =>
  `type x = ${type
    // Change `(...): return` which is invalid to `(...) => return`
    .replace(/^(\(.*\)): /, (_, p1) => `${p1} =>`)
    // Try to fix cuuted types
    .replace(/(\w+\.\.\.$)/, (_, p1) =>
      type[0] === "{" ? "}" : type[0] === "<" ? ">" : ""
    )
    .replaceAll(/... (\d{0,}) more ...;/g, (_, p1) => `___MORE___: ${p1};`)
    .replaceAll(/... (\d{0,}) more .../g, (_, p1) => `___${p1}MORE___`)
    .replaceAll("...;", "___KEY___: ___THREE_DOTS___;")
    .replaceAll("...", "__THREE_DOTS__")};`;

const convertToOriginalType = (type: string) =>
  type
    .replaceAll(/___MORE___: (\d{0,});/g, (_, p1) => `... ${p1} more ...;`)
    .replaceAll(/___(\d{0,})MORE___/g, (_, p1) => `... ${p1} more ...`)
    .replaceAll("___KEY___: ___THREE_DOTS___", "...;")
    .replaceAll("__THREE_DOTS__", "...")
    .replaceAll(/... (\d{0,}) more .../g, (_, p1) => `/* ${p1} more */`) // ... x more ... not shown sell
    .replace(/type x =[ ]?((.|\n)*);.*/g, "$1")
    .trim();
