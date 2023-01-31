import dedent from "ts-dedent";
import { blockColor } from "./consts/colors";

export const unstyledCodeBlock = (content: string) => dedent/*html*/ `
  <code>${content}</code>
`;

export const codeBlock = (code: string, language: string) => dedent/*html*/ `
  <span class="codicon codicon-none" style="background-color:${blockColor};">

    \`\`\`${language}
    ${code}
    \`\`\`

  </span>
`;

export const inlineCodeBlock = (
  code: string,
  language: string
) => dedent/*html*/ `
  </span>
  ${codeBlock(` ${code} `, language)}
  <span>
`;

export const miniLine = "<p></p>";

export const multiLineCodeBlock = (code: string, language: string) => {
  const maxLineChars = Math.max(...code.split("\n").map((line) => line.length));
  // codicon class align the code to the center so we must padd it with spaces
  const paddedCode = code
    .split("\n")
    .map((line) => line.padEnd(maxLineChars + 2))
    .join("\n");

  return dedent/*html*/ `
    </span>
    ${miniLine}
    ${codeBlock(paddedCode, language)}
    ${miniLine}
    <span>`;
};
