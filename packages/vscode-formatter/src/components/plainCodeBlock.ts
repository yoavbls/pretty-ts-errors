import { d } from "@pretty-ts-errors/utils";

/**
 * Code block without syntax highlighting like.
 * For syntax highlighting, use {@link inlineCodeBlock} or {@link multiLineCodeBlock}
 */
export const plainCodeBlock = (content: string) => d /*html*/ `
  <code>${content}</code>
`;
