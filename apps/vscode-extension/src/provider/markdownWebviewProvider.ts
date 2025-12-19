import type { ExtensionContext } from "vscode";
import * as vscode from "vscode";
import { getUserLangs, getUserTheme } from "vscode-shiki-bridge";
import { HighlighterCore, createHighlighterCore } from "shiki/core";
import { createOnigurumaEngine } from "shiki/engine/oniguruma";
import { createMarkdownExit, type MarkdownExit } from "markdown-exit";

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

function createMarkdownExitPatched(
  highlight: (code: string) => Promise<string>
) {
  const md = createMarkdownExit({
    html: true,
    highlight,
  });
  const fence = md.renderer.rules.fence;
  md.renderer.rules.fence = async (...args) => {
    let result = await fence!(...args);
    // annoyingly, markdown-[ex]it render code blocks with a wrapping `<pre><code>` block, and do not provide any means to prevent this
    // a custom fence rule is recommended, but requires having to copy (and maintain) internal utility functions, which is insanity if you ask me
    // see https://shiki.style/packages/markdown-it#transformer-caveats
    // and https://github.com/markdown-it/markdown-it/issues/269
    // and https://github.com/olets/markdown-it-wrapperless-fence-rule/issues/1
    // instead we use this replace to remove the annoying wrapper elements
    result = result.replace(/^<pre><code class="language-[a-zA-Z]+">/, "");
    result = result.replace(/<\/code><\/pre>\n?$/, "");
    return result.trim();
  };
  return md;
}

/**
 * @see https://github.com/microsoft/vscode-extension-samples/blob/main/webview-sample
 */
export class MarkdownWebviewProvider {
  static readonly viewType = "prettyTsErrors.markdownPreview";
  private highlighter: HighlighterCore | null = null;
  private theme = "";
  private md: MarkdownExit = createMarkdownExitPatched(
    this.highlight.bind(this)
  );
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

  private async initializeHighlighter() {
    if (this.highlighter) {
      return;
    }

    const [theme, themes] = await getUserTheme();
    this.theme = theme;
    if (themes[0] === "none") {
      throw new Error("could not load user theme");
    }
    const langs = await getUserLangs(["type", "ts"]);
    this.highlighter = await createHighlighterCore({
      themes,
      langs,
      engine: createOnigurumaEngine(import("shiki/wasm")),
    });
  }

  getWebviewOptions(): vscode.WebviewOptions {
    return {
      enableCommandUris: [
        "prettyTsErrors.revealSelection",
        "prettyTsErrors.copyError",
      ],
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
    const template = await this.webviewHtmlTemplate;
    const html = this.patchCspSafeAttrs(template, webview);
    const renderedMarkdown = await this.renderMarkdown(content);
    return html.replace(
      '<div id="content"></div>',
      `<div id="content">${renderedMarkdown}</div>`
    );
  }

  private patchCspSafeAttrs(html: string, webview: vscode.Webview) {
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
    return html;
  }

  private async renderMarkdown(markdown: string): Promise<string> {
    let html = await this.md.renderAsync(markdown);
    // remove `codicon codicon-none` classes as it is only needed for the hover tooltip as a hack
    html = html.replaceAll("codicon codicon-none", "");
    return html;
  }

  private async highlight(code: string, lang = "type"): Promise<string> {
    await this.initializeHighlighter();
    const transformers = [
      {
        name: "remove-background-only",
        pre(node: { properties: { style?: unknown } }) {
          // Only remove background-color from pre tag, keep other styles
          if (node.properties["style"]) {
            node.properties["style"] = (
              node.properties["style"] as string
            ).replace(/background-color:[^;]+;?/g, "");
          }
        },
        code(node: { properties: { style?: unknown } }) {
          // Only remove background-color from code tag
          if (node.properties["style"]) {
            node.properties["style"] = (
              node.properties["style"] as string
            ).replace(/background-color:[^;]+;?/g, "");
          }
        },
      },
    ];
    let html = this.highlighter!.codeToHtml(code.trim(), {
      lang,
      theme: this.theme,
      transformers,
    });
    // wrap the highlighted code in a container with a copy button
    html = `
    <div class="code-container">
      <button class="copy-button" data-copy-content="${code
        .trim()
        .replace(
          /`/g,
          "\\`"
        )}"><span class="codicon codicon-copy" title="Copy type to clipboard"><span></button>
      ${html}
    </div>
    `;
    return html;
  }
}
