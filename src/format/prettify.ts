import parserTypescript from "prettier/parser-typescript";
import { format } from "prettier/standalone";
import * as logger from '../logger';

export function prettify(text: string) {
  return logger.measure(`prettify: ${text}`, () => format(text, {
    plugins: [parserTypescript],
    parser: "typescript",
    printWidth: 60,
    singleAttributePerLine: false,
    arrowParens: "avoid",
  }));
}
