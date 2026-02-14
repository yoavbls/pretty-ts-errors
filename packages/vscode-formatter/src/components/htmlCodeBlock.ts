import { CodeBlockFn } from "@pretty-ts-errors/formatter";

interface Highlighter {
  codeToHtml(code: string, options: { lang: string; theme: string }): string;
}

let highlighter: Highlighter | null = null;
let currentTheme = "";

export function initHighlighter(h: Highlighter, theme: string) {
  highlighter = h;
  currentTheme = theme;
}

export const htmlCodeBlock: CodeBlockFn = (code, language, multiLine) => {
  if (!language) {
    return `<code>${code}</code>`;
  }

  if (!highlighter) {
    throw new Error(
      "htmlCodeBlock not initialized. Call initHighlighter() first."
    );
  }

  const highlighted = highlighter.codeToHtml(code.trim(), {
    lang: language,
    theme: currentTheme,
  });

  if (multiLine) {
    return (
      `<p></p>` +
      `<div class="code-container">` +
      `<button class="copy-button" data-copy-content><span class="codicon codicon-copy" title="Copy type to clipboard"><span></button>` +
      highlighted +
      `</div>` +
      `<p></p>`
    );
  }

  // Inline: strip <pre> wrapper, keep as inline element
  const inlineHtml = highlighted
    .replace(/^<pre[^>]*><code[^>]*>/, "")
    .replace(/<\/code><\/pre>$/, "");
  return `<code style="background-color:var(--vscode-textCodeBlock-background);padding:4px 8px;border-radius:4px;">${inlineHtml}</code>`;
};
