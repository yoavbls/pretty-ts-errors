import { d } from "../utils";
import { miniLine } from "./miniLine";
import { spanBreak } from "./spanBreak";

/**
 * @returns markdown string that will be rendered as a code block (`supportHtml` required)
 * We're using codicon here since it's the only thing that can be `inline-block`
 * and have a background color in hovers due to strict sanitization of markdown on
 * VSCode [code](https://github.com/microsoft/vscode/blob/735aff6d962db49423e02c2344e60d418273ae39/src/vs/base/browser/markdownRenderer.ts#L372)
 */
const codeBlock = (code: string, language: string) =>
  spanBreak(d/*html*/ `
  <span class="codicon codicon-none" style="background-color:var(--vscode-textCodeBlock-background);">

    \`\`\`${language}
    ${code}
    \`\`\`

  </span>
`);

export const inlineCodeBlock = (code: string, language: string) =>
  codeBlock(` ${code} `, language);

export const multiLineCodeBlock = (code: string, language: string) => {
  const codeSplit = code.split("\n");

  const maxLineChars = codeSplit.reduce((acc,curr)=> curr.length > acc ? curr.length : acc, 0);
  // codicon class align the code to the center so we must padd it with spaces
  const paddedCode = codeSplit
    .map((line) => line.padEnd(maxLineChars + 2))
    .join("\n");

  return d/*html*/ `    
    ${miniLine}
    ${codeBlock(paddedCode, language)}
    ${miniLine}
    `;
};
