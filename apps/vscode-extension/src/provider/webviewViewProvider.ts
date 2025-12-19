import type { ExtensionContext } from "vscode";
import * as vscode from "vscode";
import { MarkdownWebviewProvider } from "./markdownWebviewProvider";
import { uriStore } from "./uriStore";
import { has } from "packages/utils";

const SUPPORTED_LANGUAGE_IDS = [
  "typescript",
  "typescriptreact",
  "javascript",
  "javascriptreact",
];

const NO_DIAGNOSTICS_MESSAGE =
  "Select code with an error to show the prettified diagnostic in this view.";

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
      }),
      vscode.window.onDidChangeTextEditorSelection((event) => {
        const document = event.textEditor.document;
        if (!has(SUPPORTED_LANGUAGE_IDS, document.languageId)) {
          return;
        }
        this.refresh(webviewView.webview);
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
    const selection = activeEditor?.selection;
    if (activeEditor && selection) {
      const uri = activeEditor.document.uri;
      const diagnostics = uriStore[uri.fsPath] ?? [];
      const diagnostic = diagnostics.find((diagnostic) =>
        diagnostic.range.contains(selection)
      );
      if (diagnostic) {
        markdown = diagnostic.contents.map((item) => item.value).join("\n");
      }
    }
    webview.html = await this.provider.getWebviewContent(webview, markdown);
  }
}
