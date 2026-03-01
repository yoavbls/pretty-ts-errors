import { format } from "prettier/standalone";
import * as parserEstree from "prettier/plugins/estree";
import * as parserTypescript from "prettier/plugins/typescript";

export async function formatWithPrettier(text: string) {
  return format(text, {
    plugins: [parserTypescript, parserEstree],
    parser: "typescript",
    printWidth: 60,
    arrowParens: "avoid",
    semi: false,
    singleQuote: false,
  });
}
