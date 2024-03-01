import { inlineCodeBlock, multiLineCodeBlock } from "./codeBlock";
import { d } from "../utils";
import { Output } from "../types";

/**
 * Code block without syntax highlighting like.
 * For syntax highlighting, use {@link inlineCodeBlock} or {@link multiLineCodeBlock}
 */
export const unStyledCodeBlock = (content: string, output: Output = "html") => {
  switch (output) {
    case "plaintext":
      return d`'${content}'`;
    case "html":
      return d/*html*/ `
      <code> ${content} </code>
    `;
  }
};
