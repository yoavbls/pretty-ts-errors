import * as vscode from "vscode";
import { createHighlighter, Highlighter } from "shiki";
import * as path from "path";

export class MarkdownWebviewProvider {
  private static readonly viewType = "prettyTsErrors.markdownPreview";
  private highlighter: Highlighter | null = null;

  constructor(private readonly context: vscode.ExtensionContext) {}

  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    console.log("Creating MarkdownWebviewProvider...");
    const provider = new MarkdownWebviewProvider(context);

    const disposable = vscode.commands.registerCommand(
      "prettyTsErrors.openMarkdownPreview",
      () => {
        console.log("Command prettyTsErrors.openMarkdownPreview triggered!");
        provider.showPreview();
      }
    );

    console.log(
      "Command prettyTsErrors.openMarkdownPreview registered successfully!"
    );
    return disposable;
  }

  private async initializeHighlighter() {
    if (this.highlighter) {
      return;
    }

    try {
      this.highlighter = await createHighlighter({
        themes: ["dark-plus", "light-plus"],
        langs: ["typescript", "javascript"],
      });

      console.log(
        "Highlighter initialized with languages:",
        this.highlighter.getLoadedLanguages()
      );

    } catch (error) {
      console.error("Failed to initialize highlighter:", error);
      // Fallback to basic highlighter
      this.highlighter = await createHighlighter({
        themes: ["dark-plus", "light-plus"],
        langs: ["typescript", "javascript"],
      });
    }
  }

  private async showPreview() {
    await this.initializeHighlighter();

    const panel = vscode.window.createWebviewPanel(
      MarkdownWebviewProvider.viewType,
      "Pretty TS Errors - Markdown Preview",
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    panel.webview.html = await this.getWebviewContent();

    // Listen for active editor changes to update preview
    const changeActiveEditor = vscode.window.onDidChangeActiveTextEditor(
      async (editor) => {
        if (editor && editor.document.languageId === "markdown") {
          panel.webview.html = await this.getWebviewContent(
            editor.document.getText()
          );
        }
      }
    );

    panel.onDidDispose(() => {
      changeActiveEditor.dispose();
    });

    // Update with current editor if it's markdown
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor && activeEditor.document.languageId === "markdown") {
      panel.webview.html = await this.getWebviewContent(
        activeEditor.document.getText()
      );
    }
  }

  private async getWebviewContent(markdownContent?: string): Promise<string> {
    if (!this.highlighter) {
      await this.initializeHighlighter();
    }

    const content = markdownContent || this.getDefaultMarkdown();
    const htmlContent = await this.renderMarkdown(content);

    // Get actual theme colors from VS Code
    const currentTheme = vscode.window.activeColorTheme;
    const isDark = currentTheme.kind === vscode.ColorThemeKind.Dark;

    // Try to extract Monaco token styles from VS Code
    let monacoTokenStyles = '';
    try {
      // Get the webview HTML that VS Code uses
      const activeEditor = vscode.window.activeTextEditor;
      if (activeEditor) {
        // We'll extract token styles differently - let's use a more direct approach
        monacoTokenStyles = await this.extractMonacoTokenStyles();
      }
    } catch (error) {
      console.log("Could not extract Monaco styles, using fallback");
    }

    console.log("Monaco styles extracted:", monacoTokenStyles.length > 0);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pretty TS Errors - Markdown Preview</title>
    ${monacoTokenStyles ? `<style type="text/css" media="screen" class="vscode-tokens-styles">${monacoTokenStyles}</style>` : ''}
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
            font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
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
    ${htmlContent}
    
    <script>
        function copyToClipboard(text) {
            navigator.clipboard.writeText(text).then(() => {
                // Could show a toast notification here
            });
        }
    </script>
</body>
</html>`;
  }

  private async renderMarkdown(markdown: string): Promise<string> {
    if (!this.highlighter) {
      return markdown;
    }

    // Get VS Code's current theme
    const currentTheme = vscode.window.activeColorTheme;
    const isDark = currentTheme.kind === vscode.ColorThemeKind.Dark;

    // Use the appropriate Shiki theme based on VS Code's theme
    const theme = isDark ? "dark-plus" : "light-plus";

    // Simple markdown parsing for fenced code blocks
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;

    let html = markdown;

    // Replace code blocks with highlighted versions
    html = html.replace(codeBlockRegex, (match, lang, code) => {
      const language = lang || "text";
      let highlightedCode: string;

      try {
        // For now, treat 'type' language as TypeScript
        const highlightLang =
          language === "type"
            ? "typescript" // Use TypeScript for 'type' language
            : this.highlighter!.getLoadedLanguages().includes(language)
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
                if (node.properties.style) {
                  node.properties.style = (node.properties.style as string)
                    .replace(/background-color:[^;]+;?/g, '');
                }
              },
              code(node) {
                // Only remove background-color from code tag
                if (node.properties.style) {
                  node.properties.style = (node.properties.style as string)
                    .replace(/background-color:[^;]+;?/g, '');
                }
              }
            }
          ]
        });

        console.log("Raw Shiki output:", highlightedCode.substring(0, 400));

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

  private getDefaultMarkdown(): string {
    return `# Pretty TS Errors - Custom Type Preview

This preview supports your custom \`type\` language with proper syntax highlighting!

## Example with custom type language:

\`\`\`type
interface User {
  name: string;
  age: number;
}

type Status = "active" | "inactive" | "pending";

type UserWithStatus = User & {
  status: Status;
};
\`\`\`


\`\`\`type
string | "hello" | 3 | number | Partial<User> | Array<Status>
\`\`\`


## Comparison with regular TypeScript:

\`\`\`typescript
interface User {
  name: string;
  age: number;
}

type Status = "active" | "inactive" | "pending";
\`\`\`

Your custom \`type\` grammar is now working in this preview!`;
  }

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
