import { d } from "../deps";

/**
 * Code block without syntax highlighting like.
 * For syntax highlighting, use {@link inlineCodeBlock} or {@link multiLineCodeBlock}
 */
export const unstyledCodeBlock = (content: string) => d/*html*/ `
  <code>${content}</code>
`;
