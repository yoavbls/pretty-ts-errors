import type { ExtensionContext } from "vscode";
import * as vscode from "vscode";
import { has } from "@pretty-ts-errors/utils";
import { formattedDiagnosticsStore, type FormattedDiagnostic } from "../formattedDiagnosticsStore";
import { logger } from "../logger";
import { SUPPORTED_LANGUAGE_IDS } from "../supportedLanguageIds";
import { MarkdownWebviewProvider } from "./markdownWebviewProvider";
import { invalidateSidebarSyntaxHighlighter } from "./sidebarSyntaxHighlighter";
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
    vscode.window.onDidChangeActiveTextEditor(() => updateHasErrorsContext()),
    vscode.window.onDidChangeActiveColorTheme(() => {
      invalidateSidebarSyntaxHighlighter();
      viewProviderInstance?.invalidateAndRefresh();
    })
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

  async lockToDiagnostic(
    uri: vscode.Uri | undefined,
    range: vscode.Range,
    message?: string,
  ) {
    const diagnostic = this.findDiagnostic(uri, range, message);
    if (!diagnostic) {
      logger.warn(
        `unable to lock sidebar to diagnostic at ${range.start.line}:${range.start.character}`
      );
      return;
    }

    logger.debug(
      `locking sidebar to diagnostic ${diagnostic.documentUri.toString(true)} at ${range.start.line}:${range.start.character}`
    );
    this.mode = "locked";
    this.lockedContent = diagnostic;
    this.skipNextSelectionChange = true;
    this.skipNextEditorChange = true;
    this.lastModelKey = null;
    if (this.webview) {
      this.refresh(this.webview);
    }
  }

  async pinDiagnostic(
    uri: vscode.Uri | undefined,
    range: vscode.Range,
    message?: string,
  ) {
    const diagnostic = this.findDiagnostic(uri, range, message);
    if (!diagnostic) {
      logger.warn(
        `unable to pin diagnostic at ${range.start.line}:${range.start.character}`
      );
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

  invalidateAndRefresh() {
    this.lastModelKey = null;
    if (this.webview) {
      void this.refresh(this.webview);
    }
  }

  async resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext
  ): Promise<void> {
    logger.debug("resolving prettyTsErrors side panel webview");
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
        void this.refresh(webviewView.webview)
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
          void this.refresh(webviewView.webview);
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
          void this.refresh(webviewView.webview);
        }
      }),
      webviewView.onDidChangeVisibility(() => {
        if (webviewView.visible) {
          void this.refresh(webviewView.webview);
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

  private findDiagnostic(
    uri: vscode.Uri | undefined,
    range: vscode.Range,
    message?: string,
  ): FormattedDiagnostic | null {
    const activeEditor = vscode.window.activeTextEditor;
    const storeKey = uri?.fsPath ?? activeEditor?.document.uri.fsPath;
    if (!storeKey) {
      logger.warn("cannot resolve diagnostic without a uri or active editor");
      return null;
    }

    const diagnostics = formattedDiagnosticsStore.get(storeKey) ?? [];
    if (diagnostics.length === 0) {
      logger.warn(`no formatted diagnostics were found for ${storeKey}`);
      return null;
    }

    const exactMatch = diagnostics.find((item) => {
      return (
        item.range.isEqual(range) &&
        (message === undefined || item.lspDiagnostic.message === message)
      );
    });
    if (exactMatch) {
      return exactMatch;
    }

    const overlappingMatch = diagnostics.find((item) => {
      return (
        item.range.intersection(range) !== undefined &&
        (message === undefined || item.lspDiagnostic.message === message)
      );
    });
    if (overlappingMatch) {
      logger.warn(
        `diagnostic lookup for ${storeKey} fell back from exact range matching to overlap matching`
      );
      return overlappingMatch;
    }

    logger.warn(
      `diagnostic lookup failed for ${storeKey}; formatted diagnostics count=${diagnostics.length}`
    );
    return null;
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

  private async createViewModel(
    items: FormattedDiagnostic[],
  ): Promise<SidebarViewModel> {
    const pinned =
      this.pinnedError === null
        ? null
        : await createSidebarDiagnosticModel(this.pinnedError);

    const diagnostics = await Promise.all(
      items.map((item) => {
        const note =
          this.pinnedError !== null && isSameDiagnostic(this.pinnedError, item)
            ? "This item is pinned on top."
            : undefined;

        return note === undefined
          ? createSidebarDiagnosticModel(item)
          : createSidebarDiagnosticModel(item, { note });
      }),
    );

    return {
      pinned,
      diagnostics,
      emptyMessage: NO_DIAGNOSTICS_MESSAGE,
    };
  }

  async refresh(webview: vscode.Webview) {
    if (this.view && !this.view.visible) {
      logger.trace("skipping side panel refresh because the view is hidden");
      return;
    }

    const model = await this.createViewModel(this.getActiveDiagnosticItems());
    const modelKey = JSON.stringify(model);
    if (modelKey === this.lastModelKey) {
      logger.trace("skipping side panel refresh because the model did not change");
      return;
    }

    logger.debug(
      `posting side panel model with ${model.diagnostics.length} active diagnostic(s) and ${model.pinned === null ? 0 : 1} pinned diagnostic(s)`
    );
    webview.postMessage({ command: "render-sidebar", model });
    this.lastModelKey = modelKey;
  }
}
