import { format } from "prettier/standalone";
import parserEstree from "prettier/plugins/estree";
import parserTypescript from "prettier/plugins/typescript";

export async function formatTypeWithPrettier(text: string) {
  return format(text, {
    plugins: [parserTypescript, parserEstree],
    parser: "typescript",
    printWidth: 48,
    tabWidth: 4,
    useTabs: false,
    arrowParens: "avoid",
    semi: false,
    singleQuote: false,
  });
}
