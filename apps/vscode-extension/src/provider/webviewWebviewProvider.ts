import type { ExtensionContext } from "vscode";
import * as vscode from "vscode";
import { MarkdownWebviewProvider } from "./markdownWebviewProvider";
import { uriStore } from "./uriStore";

const NO_DIAGNOSTICS_MESSAGE = "No diagnostics for the current file.";

export function registerWebviewViewProvider(context: ExtensionContext) {
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "prettyTsErrors.markdownPreview",
      new MarkdownWebviewViewProvider(new MarkdownWebviewProvider(context))
    )
  );
}

class MarkdownWebviewViewProvider implements vscode.WebviewViewProvider {
  private disposables = new Map<vscode.WebviewView, vscode.Disposable[]>();
  constructor(private readonly provider: MarkdownWebviewProvider) {}

  async resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext
  ): Promise<void> {
    this.refresh(webviewView.webview);
    let disposables = this.disposables.get(webviewView);
    if (!disposables) {
      disposables = [];
      this.disposables.set(webviewView, disposables);
    }

    webviewView.webview.options = this.provider.getWebviewOptions();
    disposables.push(
      webviewView.webview.onDidReceiveMessage(
        this.provider.createOnDidReceiveMessage()
      )
    );

    disposables.push(
      vscode.languages.onDidChangeDiagnostics(() =>
        this.refresh(webviewView.webview)
      ),
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor) {
          this.refresh(webviewView.webview);
        }
      })
    );

    webviewView.onDidDispose(() => {
      const disposables = this.disposables.get(webviewView);
      disposables?.forEach((disposable) => disposable.dispose());
      this.disposables.delete(webviewView);
    });
  }

  async refresh(webview: vscode.Webview) {
    let markdown = NO_DIAGNOSTICS_MESSAGE;
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
      const uri = activeEditor.document.uri;
      const diagnostics = uriStore[uri.fsPath];
      // TODO: change this to the last hovered/clicked error;
      if (diagnostics && diagnostics?.length > 0) {
        const first = diagnostics[0]!;
        markdown = first.contents.map((item) => item.value).join("\n");
      }
    }
    const html = await this.provider.getWebviewContent(webview, markdown);
    webview.html = html;
  }
}
