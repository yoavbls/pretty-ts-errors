import { d } from "@pretty-ts-errors/utils";
import { miniLine } from "./miniLine";
import { spanBreak } from "./spanBreak";
import { CodeBlockFn } from "@pretty-ts-errors/formatter";
import { plainCodeBlock } from "./plainCodeBlock";

/**
 * @returns markdown string that will be rendered as a code block (`supportHtml` required)
 * We're using codicon here since it's the only thing that can be `inline-block`
 * and have a background color in hovers due to strict sanitization of markdown on
 * VSCode [code](https://github.com/microsoft/vscode/blob/735aff6d962db49423e02c2344e60d418273ae39/src/vs/base/browser/markdownRenderer.ts#L372)
 */
const codeBlock = (code: string, language: string) =>
  spanBreak(d /*html*/ `
  <span class="codicon codicon-none" style="background-color:var(--vscode-textCodeBlock-background);">

    \`\`\`${language}
    ${code}
    \`\`\`

  </span>
`);

const inlineHoverCodeBlock = (code: string, language: string) =>
  codeBlock(` ${code} `, language);

const multiLineHoverCodeBlock = (code: string, language: string) => {
  const codeLines = code.split("\n");
  //this line is finding the longest line
  const maxLineChars = codeLines.reduce(
    (acc, curr) => (curr.length > acc ? curr.length : acc),
    0
  );
  // codicon class align the code to the center, so we must pad it with spaces
  const paddedCode = codeLines
    .map((line) => line.padEnd(maxLineChars + 2))
    .join("\n");

  return d /*html*/ `    
    ${miniLine}
    ${codeBlock(paddedCode, language)}
    ${miniLine}
    `;
};

export const hoverCodeBlock: CodeBlockFn = (code, language, multiLine) => {
  if (!language) {
    return plainCodeBlock(code);
  }
  if (multiLine) {
    return multiLineHoverCodeBlock(code, language);
  }
  return inlineHoverCodeBlock(code, language);
};
