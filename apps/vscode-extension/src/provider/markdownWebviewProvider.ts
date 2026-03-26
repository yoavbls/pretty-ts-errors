import * as vscode from "vscode";

/**
 * @see https://github.com/microsoft/vscode-extension-samples/blob/main/webview-sample
 */
export class MarkdownWebviewProvider {
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
    const htmlTemplateBytes =
      await vscode.workspace.fs.readFile(htmlTemplateUri);
    const htmlTemplate = new TextDecoder("utf-8").decode(htmlTemplateBytes);
    return htmlTemplate;
  }

  getWebviewOptions(): vscode.WebviewOptions {
    return {
      enableCommandUris: [
        "prettyTsErrors.revealSelection",
        "prettyTsErrors.copyError",
        "prettyTsErrors.pinError",
        "prettyTsErrors.unpinError",
      ],
      enableScripts: true,
      enableForms: false,
      localResourceRoots: [this.webviewRootUri],
    };
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
    content: string,
    classList: string[] = []
  ): Promise<string> {
    const template = await this.webviewHtmlTemplate;
    const html = this.patchCspSafeAttrs(template, webview);
    return html.replace(
      '<div id="content"></div>',
      `<div id="content" class="${classList.join(" ")}">${content}</div>`
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
}
