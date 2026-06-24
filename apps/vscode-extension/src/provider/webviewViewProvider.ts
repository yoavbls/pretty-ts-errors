import type { ExtensionContext } from "vscode";
import * as vscode from "vscode";
import { has } from "@pretty-ts-errors/utils";
import { formattedDiagnosticsStore, type FormattedDiagnostic } from "../formattedDiagnosticsStore";
import { SUPPORTED_LANGUAGE_IDS } from "../supportedLanguageIds";
import { MarkdownWebviewProvider } from "./markdownWebviewProvider";
import { createSidebarDiagnosticModel, type SidebarViewModel } from "./sidebarViewModel";

const NO_DIAGNOSTICS_MESSAGE =
  "Select code with an error to show the prettified diagnostic in this view.";

type ViewMode = "cursor" | "locked";

let viewProviderInstance: MarkdownWebviewViewProvider | null = null;

export function getViewProvider() {
  return viewProviderInstance;
}

function updateHasErrorsContext() {
  const editor = vscode.window.activeTextEditor;
  if (editor && has(SUPPORTED_LANGUAGE_IDS, editor.document.languageId)) {
    const diagnostics = vscode.languages.getDiagnostics(editor.document.uri);
    const hasErrors = diagnostics.length > 0;
    vscode.commands.executeCommand(
      "setContext",
      "prettyTsErrors.hasErrors",
      hasErrors
    );
  } else {
    vscode.commands.executeCommand(
      "setContext",
      "prettyTsErrors.hasErrors",
      false
    );
  }
}

function isSameDiagnostic(left: FormattedDiagnostic, right: FormattedDiagnostic) {
  return (
    left.lspDiagnostic.message === right.lspDiagnostic.message &&
    left.range.isEqual(right.range)
  );
}

export function registerWebviewViewProvider(context: ExtensionContext) {
  viewProviderInstance = new MarkdownWebviewViewProvider(
    new MarkdownWebviewProvider(context)
  );
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "prettyTsErrors.sidePanel",
      viewProviderInstance,
      { webviewOptions: { retainContextWhenHidden: true } }
    ),
    vscode.languages.onDidChangeDiagnostics(() => updateHasErrorsContext()),
    vscode.window.onDidChangeActiveTextEditor(() => updateHasErrorsContext())
  );
  updateHasErrorsContext();
}

class MarkdownWebviewViewProvider implements vscode.WebviewViewProvider {
  private disposables = new Map<vscode.WebviewView, vscode.Disposable[]>();
  private webview: vscode.Webview | null = null;
  private view: vscode.WebviewView | null = null;
  private mode: ViewMode = "cursor";
  private lockedContent: FormattedDiagnostic | null = null;
  private pinnedError: FormattedDiagnostic | null = null;
  private lastModelKey: string | null = null;
  private skipNextSelectionChange = false;
  private skipNextEditorChange = false;

  constructor(private readonly provider: MarkdownWebviewProvider) {}

  async lockToDiagnostic(range: vscode.Range, message?: string) {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
      return;
    }

    const diagnostics =
      formattedDiagnosticsStore.get(activeEditor.document.uri.fsPath) ?? [];
    const diagnostic = diagnostics.find(
      (item) =>
        item.range.isEqual(range) &&
        (message === undefined || item.lspDiagnostic.message === message)
    );

    if (!diagnostic) {
      return;
    }

    this.mode = "locked";
    this.lockedContent = diagnostic;
    this.skipNextSelectionChange = true;
    this.skipNextEditorChange = true;
    this.lastModelKey = null;
    if (this.webview) {
      this.refresh(this.webview);
    }
  }

  async pinDiagnostic(range: vscode.Range, message?: string) {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
      return;
    }

    const diagnostics =
      formattedDiagnosticsStore.get(activeEditor.document.uri.fsPath) ?? [];
    const diagnostic = diagnostics.find(
      (item) =>
        item.range.isEqual(range) &&
        (message === undefined || item.lspDiagnostic.message === message)
    );
    if (!diagnostic) {
      return;
    }

    if (this.pinnedError && isSameDiagnostic(this.pinnedError, diagnostic)) {
      this.pinnedError = null;
    } else {
      this.pinnedError = diagnostic;
    }

    if (this.webview) {
      this.refresh(this.webview);
    }
  }

  unpinDiagnostic() {
    this.pinnedError = null;
    if (this.webview) {
      this.refresh(this.webview);
    }
  }

  async resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext
  ): Promise<void> {
    this.webview = webviewView.webview;
    this.view = webviewView;
    webviewView.webview.options = this.provider.getWebviewOptions();
    webviewView.webview.html = await this.provider.getWebviewContent(
      webviewView.webview,
      ["webview-panel"]
    );

    const disposables = this.ensureDisposables(webviewView);

    disposables.push(
      webviewView.webview.onDidReceiveMessage(
        this.provider.createOnDidReceiveMessage(() => {
          void this.refresh(webviewView.webview);
        })
      ),
      vscode.languages.onDidChangeDiagnostics(() =>
        this.refresh(webviewView.webview)
      ),
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (this.skipNextEditorChange) {
          this.skipNextEditorChange = false;
          return;
        }
        if (editor) {
          if (this.mode === "locked") {
            this.mode = "cursor";
          }
          this.refresh(webviewView.webview);
        }
      }),
      vscode.window.onDidChangeTextEditorSelection((event) => {
        const document = event.textEditor.document;
        if (!has(SUPPORTED_LANGUAGE_IDS, document.languageId)) {
          return;
        }
        if (this.skipNextSelectionChange) {
          this.skipNextSelectionChange = false;
          return;
        }
        if (this.mode === "locked") {
          this.mode = "cursor";
        }
        if (this.mode === "cursor") {
          this.refresh(webviewView.webview);
        }
      }),
      webviewView.onDidChangeVisibility(() => {
        if (webviewView.visible) {
          this.refresh(webviewView.webview);
        }
      })
    );

    void this.refresh(webviewView.webview);

    webviewView.onDidDispose(() => {
      const viewDisposables = this.disposables.get(webviewView);
      viewDisposables?.forEach((disposable) => disposable.dispose());
      this.disposables.delete(webviewView);
      this.webview = null;
      this.view = null;
    });
  }

  private ensureDisposables(webviewView: vscode.WebviewView) {
    let disposables = this.disposables.get(webviewView);
    if (!disposables) {
      disposables = [];
      this.disposables.set(webviewView, disposables);
    }
    return disposables;
  }

  private getActiveDiagnosticItems(): FormattedDiagnostic[] {
    switch (this.mode) {
      case "cursor":
        return this.getCursorDiagnosticItems();
      case "locked":
        return this.lockedContent ? [this.lockedContent] : [];
    }
  }

  private getCursorDiagnosticItems(): FormattedDiagnostic[] {
    const activeEditor = vscode.window.activeTextEditor;
    const selection = activeEditor?.selection;
    if (!activeEditor || !selection) {
      return [];
    }

    const diagnostics =
      formattedDiagnosticsStore.get(activeEditor.document.uri.fsPath) ?? [];
    return diagnostics.filter(
      (diagnostic) => diagnostic.range.intersection(selection) !== undefined
    );
  }

  private createViewModel(items: FormattedDiagnostic[]): SidebarViewModel {
    const pinned =
      this.pinnedError === null
        ? null
        : createSidebarDiagnosticModel(this.pinnedError);

    const diagnostics = items.map((item) => {
      const note =
        this.pinnedError !== null && isSameDiagnostic(this.pinnedError, item)
          ? "This item is pinned on top."
          : undefined;

      return note === undefined
        ? createSidebarDiagnosticModel(item)
        : createSidebarDiagnosticModel(item, { note });
    });

    return {
      pinned,
      diagnostics,
      emptyMessage: NO_DIAGNOSTICS_MESSAGE,
    };
  }

  async refresh(webview: vscode.Webview) {
    if (this.view && !this.view.visible) {
      return;
    }

    const model = this.createViewModel(this.getActiveDiagnosticItems());
    const modelKey = JSON.stringify(model);
    if (modelKey === this.lastModelKey) {
      return;
    }

    webview.postMessage({ command: "render-sidebar", model });
    this.lastModelKey = modelKey;
  }
}
