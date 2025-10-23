import type { ExtensionContext } from "vscode";
import * as vscode from "vscode";
// import { getUserLangs, getUserTheme } from "vscode-shiki-bridge";
import {
  createHighlighter,
  Highlighter,
  type LanguageRegistration,
  type RawGrammar,
} from "shiki";

export function registerMarkdownWebviewProvider(context: ExtensionContext) {
  const provider = new MarkdownWebviewProvider(context);
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "prettyTsErrors.openMarkdownPreview",
      async (uri: vscode.Uri) => {
        await provider.openMarkdownPreview(uri);
      }
    )
  );
}

export class MarkdownWebviewProvider {
  private static readonly viewType = "prettyTsErrors.markdownPreview";
  private highlighter: Highlighter | null = null;

  constructor(private readonly context: vscode.ExtensionContext) {}

  private async loadTypeGrammar(): Promise<RawGrammar | null> {
    try {
      const uri = vscode.Uri.joinPath(
        this.context.extensionUri,

        "syntaxes",

        "type.tmGrammar.json"
      );

      const raw = await vscode.workspace.fs.readFile(uri);

      const json = JSON.parse(new TextDecoder("utf-8").decode(raw));

      return json as RawGrammar;
    } catch {
      console.log("failed to load type grammar");
      return null;
    }
  }

  private async initializeHighlighter() {
    if (this.highlighter) {
      return;
    }

    const customLangs: LanguageRegistration[] = [];
    const typeGrammar = await this.loadTypeGrammar();
    if (typeGrammar) {
      customLangs.push({
        ...typeGrammar,
        // Allow using "type" as a language id when calling codeToHtml
        aliases: ["type"],
      } as LanguageRegistration);
    }

    this.highlighter = await createHighlighter({
      themes: ["dark-plus", "light-plus"],
      langs: ["typescript", ...customLangs].filter(Boolean),
    });

    console.log(
      "Highlighter initialized with languages:",
      this.highlighter.getLoadedLanguages()
    );
    console.log(
      "Highlighter initialized with themes: ",
      this.highlighter.getLoadedThemes()
    );
  }

  async openMarkdownPreview(uri: vscode.Uri) {
    await this.initializeHighlighter();

    const document = await vscode.workspace.openTextDocument(uri);
    const markdown = document.getText();
    const content = this.renderMarkdown(markdown);
    const fileName = document.fileName.slice(0, -3);

    const panel = vscode.window.createWebviewPanel(
      MarkdownWebviewProvider.viewType,
      `Pretty TS Errors - ${fileName}`,
      vscode.ViewColumn.Beside,
      {
        // TODO: make symbol reference links work
        enableCommandUris: [],
        enableScripts: true,
        enableFindWidget: true,
        localResourceRoots: [],
      }
    );

    panel.webview.html = await this.getWebviewContent(content);
    panel.webview.onDidReceiveMessage(
      (message: { command: string; [key: string]: unknown }) => {
        console.log(message);
        if (message && message.command) {
          switch (message.command) {
            case "notify": {
              if (typeof message["text"] === "string") {
                vscode.window.showInformationMessage(message["text"]);
              }
            }
          }
        }
      }
    );

    vscode.window.onDidChangeActiveColorTheme(async () => {
      panel.webview.html = await this.getWebviewContent(content);
    });
  }

  private async getWebviewContent(content: string): Promise<string> {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pretty TS Errors - Markdown Preview</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }

        h1, h2, h3, h4, h5, h6 {
            color: var(--vscode-foreground);
            margin-top: 1.5em;
            margin-bottom: 0.5em;
        }

        pre {
            background-color: var(--vscode-textCodeBlock-background) !important;
            border: 1px solid var(--vscode-widget-border);
            border-radius: 4px;
            padding: 16px;
            overflow-x: auto;
            margin: 1em 0;
        }

        /* Override Shiki's background to match VS Code */
        pre code {
            background-color: transparent !important;
            border-radius: 3px;
            padding: 0 !important;
            font-weight: var(--vscode-editor-font-weight, normal);
            font-size: var(--vscode-editor-font-size, 16px);
            font-family: var(--vscode-editor-font-family), 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
        }

        .copy-button {
            position: absolute;
            top: 8px;
            right: 8px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 3px;
            padding: 4px 8px;
            cursor: pointer;
            font-size: 12px;
            opacity: 0;
            transition: opacity 0.2s;
        }

        .code-container {
            position: relative;
        }

        .code-container:hover .copy-button {
            opacity: 1;
        }

        .copy-button:hover {
            background: var(--vscode-button-hoverBackground);
        }
    </style>
</head>
<body>
    ${content}
    <!-- TODO: this should **NOT** be an inline script, see https://code.visualstudio.com/api/extension-guides/webview#content-security-policy -->
    <script>
      // wrap this in IIFE because vscode should **NEVER** be leaked into the global scope
      // @see https://code.visualstudio.com/api/extension-guides/webview#passing-messages-from-a-webview-to-an-extension
      const api = (function () {
        const vscode = acquireVsCodeApi()
        return {
          notify(text) {
            vscode.postMessage({ command: 'notify', text });
          }
        }
      })();

      async function copyToClipboard(text) {
        await navigator.clipboard.writeText(text);
        api.notify('Copied text to clipboard!');
      }
    </script>
</body>
</html>`;
  }

  private renderMarkdown(markdown: string): string {
    // Get VS Code's current theme
    const currentTheme = vscode.window.activeColorTheme;
    const isDark = currentTheme.kind === vscode.ColorThemeKind.Dark;

    // TODO: Use the appropriate Shiki theme based on VS Code's theme
    const theme = isDark ? "dark-plus" : "light-plus";

    // Simple markdown parsing for fenced code blocks
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;

    let html = markdown;

    // Replace code blocks with highlighted versions
    html = html.replace(codeBlockRegex, (_match, lang, code) => {
      const language = lang || "text";
      let highlightedCode: string;

      try {
        const highlightLang = this.highlighter!.getLoadedLanguages().includes(
          language
        )
          ? language
          : "typescript";

        console.log(
          `Highlighting with language: ${highlightLang} (requested: ${language})`
        );

        highlightedCode = this.highlighter!.codeToHtml(code.trim(), {
          lang: highlightLang,
          theme,
          transformers: [
            {
              name: "remove-background-only",
              pre(node) {
                // Only remove background-color from pre tag, keep other styles
                if (node.properties["style"]) {
                  node.properties["style"] = (
                    node.properties["style"] as string
                  ).replace(/background-color:[^;]+;?/g, "");
                }
              },
              code(node) {
                // Only remove background-color from code tag
                if (node.properties["style"]) {
                  node.properties["style"] = (
                    node.properties["style"] as string
                  ).replace(/background-color:[^;]+;?/g, "");
                }
              },
            },
          ],
        });

        // Extract just the inner HTML from the pre tag
        const preMatch = highlightedCode.match(/<pre[^>]*>([\s\S]*?)<\/pre>/);
        const innerHtml = preMatch ? preMatch[1] : code;

        return `<div class="code-container">
          <button class="copy-button" onclick="copyToClipboard(\`${code
            .trim()
            .replace(/`/g, "\\`")}\`)">Copy</button>
          <pre><code>${innerHtml}</code></pre>
        </div>`;
      } catch (error) {
        console.error("Error highlighting code:", error);
        return `<pre><code>${code}</code></pre>`;
      }
    });

    // Simple markdown to HTML conversions
    html = html.replace(/^# (.*$)/gm, "<h1>$1</h1>");
    html = html.replace(/^## (.*$)/gm, "<h2>$1</h2>");
    html = html.replace(/^### (.*$)/gm, "<h3>$1</h3>");
    html = html.replace(/^\* (.*$)/gm, "<li>$1</li>");
    html = html.replace(/\n\n/g, "</p><p>");
    html = `<p>${html}</p>`;
    html = html.replace(/<p><\/p>/g, "");
    html = html.replace(/<p>(<h[1-6]>)/g, "$1");
    html = html.replace(/(<\/h[1-6]>)<\/p>/g, "$1");
    html = html.replace(/<p>(<li>)/g, "<ul>$1");
    html = html.replace(/(<\/li>)<\/p>/g, "$1</ul>");

    return html;
  }

  // TODO: What does this do? Do we need it?
  private async extractMonacoTokenStyles(): Promise<string> {
    // For now, we'll use a hardcoded version of common Monaco styles
    // In a real implementation, you could try to extract this from VS Code's DOM
    // but that's complex from an extension context

    // Using the styles you provided as a starting point
    return `
.mtk1 { color: #cccccc; }
.mtk2 { color: #1f1f1f; }
.mtk3 { color: #569cd6; }
.mtk4 { color: #9cdcfe; }
.mtk5 { color: #ce9178; }
.mtk6 { color: #d16969; }
.mtk7 { color: #676767; }
.mtk8 { color: #d85560; }
.mtk9 { color: #9c7bff; }
.mtk10 { color: #c4c4c4; }
.mtk11 { color: #d0bf62; }
.mtk12 { color: #daa971; }
.mtk13 { color: #8cc96e; }
.mtk14 { color: #e97561; }
.mtk15 { color: #54a5ec; }
.mtk16 { color: #a4a4a4; }
.mtk17 { color: #fcb76e; }
.mtk18 { color: #3cb6c1; }
.mtk19 { color: #a8cdd0; }
.mtk20 { color: #8acdd2; }
.mtk21 { color: #ea4a5f; }
.mtk22 { color: #dcdcaa; }
.mtk23 { color: #d7ba7d; }
.mtk24 { color: #c8c8c8; }
.mtk25 { color: #ffffff; }
.mtk26 { color: #6796e6; }
.mtk27 { color: #cd9731; }
.mtk28 { color: #f44747; }
.mtk29 { color: #b267e6; }
.mtk30 { color: #c586c0; }
.mtk31 { color: #b5cea8; }
.mtki { font-style: italic; }
.mtkb { font-weight: bold; }
.mtku { text-decoration: underline; text-underline-position: under; }
.mtks { text-decoration: line-through; }
.mtks.mtku { text-decoration: underline line-through; text-underline-position: under; }

/* Map Shiki colors to Monaco token classes */
span[style*="color:#569CD6"] { color: #569cd6 !important; } /* keyword */
span[style*="color:#C586C0"] { color: #c586c0 !important; } /* keyword alt */
span[style*="color:#CE9178"] { color: #ce9178 !important; } /* string */
span[style*="color:#6A9955"] { color: #6a9955 !important; } /* comment */
span[style*="color:#B5CEA8"] { color: #b5cea8 !important; } /* number */
span[style*="color:#DCDCAA"] { color: #dcdcaa !important; } /* function */
span[style*="color:#4EC9B0"] { color: #4ec9b0 !important; } /* type */
span[style*="color:#9CDCFE"] { color: #9cdcfe !important; } /* variable */
span[style*="color:#D4D4D4"] { color: #d4d4d4 !important; } /* default */
`;
  }
}
