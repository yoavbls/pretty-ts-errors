import { blockColor, littleLine } from "./consts";

export const unstyledCodeBlock = (content: string) => `
<code>${content}</code>`;

export const codeBlock = (
  code: string,
  language: string
) => `<span class="codicon codicon-none" style="background-color:${blockColor};">

\`\`\`${language}
${code}
\`\`\`

</span>`;

/** Ends the previous span, embed code block and open new span */
export const wrappedCodeBlock = (code: string, language: string) => `</span>
${codeBlock(code, language)}
<span>`;

export const multiLineCodeBlock = (code: string, language: string) => {
  const maxLineChars = Math.max(...code.split("\n").map((line) => line.length));
  // codicon class align the code to the center so we must padd it with spaces
  const paddedCode = code
    .split("\n")
    .map((line) => line.padEnd(maxLineChars + 2))
    .join("\n");

  return `${littleLine}${wrappedCodeBlock(paddedCode, language)}${littleLine}`;
};

export const inlineCodeBlock = (code: string, language: string) =>
  wrappedCodeBlock(` ${code} `, language);
