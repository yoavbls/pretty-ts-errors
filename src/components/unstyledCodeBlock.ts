import dedent from "ts-dedent";
import { inlineCodeBlock, multiLineCodeBlock } from "./codeBlock";

/**
 * Code block without syntax highlighting like.
 * For syntax highlighting, use {@link inlineCodeBlock} or {@link multiLineCodeBlock}
 */
export const unstyledCodeBlock = (content: string) => dedent/*html*/ `
  <code>${content}</code>
`;
