import { d } from "@pretty-ts-errors/utils";

/**
 * Since every thing in the extension hover split into spans,
 * we need to close the previous span before we're opening a new one
 * Note: the line breaks is important here
 */
export const spanBreak = (children: string) => d /*html*/ `
  </span>
  ${children}
  <span>
`;
