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
        if (!uri || !(uri instanceof vscode.Uri)) {
          console.error(
            "expected uri to be an instance of vscode.Uri, instead got: ",
            uri
          );
          return;
        }
        await provider.openMarkdownPreview(uri);
      }
    )
  );
}

/**
 * @see https://github.com/microsoft/vscode-extension-samples/blob/main/webview-sample
 */
export class MarkdownWebviewProvider {
  static readonly viewType = "prettyTsErrors.markdownPreview";
  private highlighter: Highlighter | null = null;
  private webviewRootUri: vscode.Uri;
  private webviewHtmlTemplate: Promise<string>;

  constructor(private readonly context: vscode.ExtensionContext) {
    this.webviewRootUri = vscode.Uri.joinPath(
      this.context.extensionUri,
      "webview"
    );
    this.webviewHtmlTemplate = this.loadWebviewHtmlTemplate();
  }

  private async loadWebviewHtmlTemplate(): Promise<string> {
    const htmlTemplateUri = vscode.Uri.joinPath(
      this.webviewRootUri,
      "index.html"
    );
    const htmlTemplateBytes = await vscode.workspace.fs.readFile(
      htmlTemplateUri
    );
    const htmlTemplate = new TextDecoder("utf-8").decode(htmlTemplateBytes);
    return htmlTemplate;
  }

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
      console.error("failed to load type grammar");
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
      langs: ["typescript", ...customLangs],
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

  getWebviewOptions(): vscode.WebviewOptions {
    return {
      enableCommandUris: ["prettyTsErrors.revealSelection"],
      enableScripts: true,
      enableForms: false,
      localResourceRoots: [this.webviewRootUri],
    };
  }

  private getWebviewPanelOptions(): vscode.WebviewPanelOptions {
    return {
      enableFindWidget: true,
      // NOTE: this should be kept at false if possible, as enabling it is a performance concern
      retainContextWhenHidden: false,
    };
  }

  async openMarkdownPreview(uri: vscode.Uri) {
    const document = await vscode.workspace.openTextDocument(uri);
    const markdown = document.getText();
    const content = await this.renderMarkdown(markdown);
    const fileName = document.fileName.slice(0, -3);

    const panel = vscode.window.createWebviewPanel(
      MarkdownWebviewProvider.viewType,
      `Pretty TS Errors - ${fileName}`,
      vscode.ViewColumn.Beside,
      {
        ...this.getWebviewOptions(),
        ...this.getWebviewPanelOptions(),
      }
    );

    panel.webview.html = await this.getWebviewContent(panel.webview, content);
    const disposable = panel.webview.onDidReceiveMessage(
      this.createOnDidReceiveMessage()
    );
    panel.onDidDispose(() => disposable.dispose());
  }

  createOnDidReceiveMessage() {
    return (message: { command: string; [key: string]: unknown }) => {
      if (message && message.command) {
        switch (message.command) {
          case "notify": {
            if (typeof message["text"] === "string") {
              vscode.window.showInformationMessage(message["text"]);
            }
            break;
          }
        }
      }
    };
  }

  async getWebviewContent(
    webview: vscode.Webview,
    content: string
  ): Promise<string> {
    let html = await this.webviewHtmlTemplate;

    // NOTE: I need to open a vscode issues about the injected styles and aquireVsCodeApi script not working when setting CSP headers properly
    //       If they fix that this code works just fine
    // vscode classes, styles and acquireVsCodeApi are injected with inline scripts/styles, thus what is even the point of CSP headers?

    // replace stylesheet href's to webview uri's
    html = html.replaceAll(
      /<link\s+rel="stylesheet"\s+href="(\.\/.+)"\s+data-href-as-webview-uri\s*\/?>/gm,
      (match, filePath) => {
        const path = vscode.Uri.joinPath(this.webviewRootUri, filePath);
        const uri = webview.asWebviewUri(path);
        return match.replace(filePath, uri.toString());
      }
    );

    // replace script src's to webiew uri's
    html = html.replaceAll(
      /<script\s+src="(\.\/.+)"\s+data-src-as-webview-uri\s*>/gm,
      (match, filePath) => {
        const path = vscode.Uri.joinPath(this.webviewRootUri, filePath);
        const uri = webview.asWebviewUri(path);
        return match.replace(filePath, uri.toString());
      }
    );

    // replace the local development csp header with `webview.cspSource`
    // @see https://code.visualstudio.com/api/extension-guides/webview#content-security-policy
    html = html.replace(
      /<meta\s+http-equiv="Content-Security-Policy"\s+data-csp-replace-content\s+content="(.+)"\s*\/>/m,
      (match, content) => {
        return match.replace(
          content,
          content
            .replaceAll(
              "style-src http://localhost:8080",
              // TODO: remove `unsafe-inline` if vscode ever fixes their styles and api injection
              `style-src ${webview.cspSource} 'unsafe-inline'`
            )
            .replaceAll(
              "script-src http://localhost:8080",
              // TODO: remove `unsafe-inline` if vscode ever fixes their styles and api injection
              `script-src ${webview.cspSource} 'unsafe-inline'`
            )
            .replaceAll(
              "font-src http://localhost:8080",
              `font-src ${webview.cspSource}`
            )
        );
      }
    );

    const renderedMarkdown = await this.renderMarkdown(content);
    html = html.replace(
      '<div id="content"></div>',
      `<div id="content">${renderedMarkdown}</div>`
    );

    return html;
  }

  private async renderMarkdown(markdown: string): Promise<string> {
    await this.initializeHighlighter();

    // TODO: Use the appropriate Shiki theme based on VS Code's theme
    const theme =
      vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark
        ? "dark-plus"
        : "light-plus";

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
          <button class="copy-button" data-copy-content="${code
            .trim()
            .replace(/`/g, "\\`")}">Copy</button>
          <pre><code>${innerHtml}</code></pre>
        </div>`;
      } catch (error) {
        console.error("Error highlighting code:", error);
        return `<pre><code>${code}</code></pre>`;
      }
    });

    // Simple markdown to HTML conversions
    // TODO: use a proper markdown renderer, this seems to generate a lot of empty tags, and pretty sure its invalid html that ends up being corrected by the browser
    //       markdown-it has a shiki plugin !
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
}
