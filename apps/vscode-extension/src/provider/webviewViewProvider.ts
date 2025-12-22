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
    webviewView.webview.html = await this.provider.getWebviewContent(
      webviewView.webview,
      NO_DIAGNOSTICS_MESSAGE
    );

    const disposables = this.ensureDisposables(webviewView);

    webviewView.webview.options = this.provider.getWebviewOptions();
    disposables.push(
      webviewView.webview.onDidReceiveMessage(
        this.provider.createOnDidReceiveMessage()
      ),
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
        // this event fires often, including selecting text in output windows and terminal windows
        // avoid doing unnessesary work, because it will cause noticable delays in the UI
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

    this.refresh(webviewView.webview);
  }

  private ensureDisposables(webviewView: vscode.WebviewView) {
    let disposables = this.disposables.get(webviewView);
    if (!disposables) {
      disposables = [];
      this.disposables.set(webviewView, disposables);
    }
    return disposables;
  }

  async refresh(webview: vscode.Webview) {
    const activeEditor = vscode.window.activeTextEditor;
    const selection = activeEditor?.selection;
    if (activeEditor && selection) {
      const uri = activeEditor.document.uri;
      const diagnostics = uriStore[uri.fsPath] ?? [];
      const diagnostic = diagnostics.find((diagnostic) =>
        diagnostic.range.contains(selection)
      );
      // prefer to only update the view when a new selection with an error is selected, to avoid annoying the user with the error message dissapearing whenever the cursor position changes
      if (diagnostic) {
        const markdown = diagnostic.contents
          .map((item) => item.value)
          .join("\n");
        await this.provider.updateWebviewContent(webview, markdown);
      }
    }
  }
}
