import parserTypescript from "prettier/parser-typescript";
import { format } from "prettier/standalone";

export function prettify(text: string) {
  return format(text, {
    plugins: [parserTypescript],
    parser: "typescript",
    printWidth: 60,
    singleAttributePerLine: false,
    arrowParens: "avoid",
  });
}

