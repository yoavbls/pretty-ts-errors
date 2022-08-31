import { format } from "prettier";
import {
  inlineCodeBlock,
  multiLineCodeBlock,
  unstyledCodeBlock,
} from "./codeBlock";

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
    prettyType = format(`type x = ${type};`, {
      parser: "typescript",
      printWidth: 60,
    })
      .replace(/type x =[ ]?((.|\n)*);.*/g, "$1")
      .trim();
  } catch (e) {
    return unstyledCodeBlock(type);
  }

  if (prettyType.includes("\n")) {
    return `${prefix}: ${multiLineCodeBlock(prettyType, "type")}`;
  } else {
    return `${prefix} ${inlineCodeBlock(prettyType, "type")}`;
  }
};
