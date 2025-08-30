import {
  inlineCodeBlock,
  multiLineCodeBlock,
  unStyledCodeBlock,
} from "../renderers";
import { prettifyType } from "./prettifyType";

export function formatTypeBlock(
  prefix: string,
  type: string,
  format: (type: string) => string
) {
  if (type.match(/^(\[\]|\{\})$/)) {
    return `${prefix} ${unStyledCodeBlock(type)}`;
  }

  if (
    type.match(
      /^((void|null|undefined|any|number|string|bigint|symbol|readonly|typeof)(\[\])?)$/
    )
  ) {
    return `${prefix} ${inlineCodeBlock(type, "type")}`;
  }

  const prettyType = prettifyType(type, format);

  if (prettyType.includes("\n")) {
    return `${prefix}: ${multiLineCodeBlock(prettyType, "type")}`;
  } else {
    return `${prefix} ${inlineCodeBlock(prettyType, "type")}`;
  }
}

export { prettifyType } from "./prettifyType";

