import { format } from "prettier";

export function prettify(text: string) {
  return format(text, {
    parser: "typescript",
    printWidth: 60,
    singleAttributePerLine: false,
    arrowParens: "avoid",
  });
}
