import type { ExtensionContext } from "vscode";
import * as vscode from "vscode";
import { getTheme, getUserLangs, getUserTheme } from "vscode-shiki-bridge";
import {
  createHighlighterCore,
  LanguageRegistration,
  ThemeRegistration,
} from "shiki/core";
import { createOnigurumaEngine } from "shiki/engine/oniguruma";
import { MarkdownWebviewProvider } from "./markdownWebviewProvider";
import {
  formattedDiagnosticsStore,
  type FormattedDiagnostic,
} from "../formattedDiagnosticsStore";
import { has } from "@pretty-ts-errors/utils";
import {
  prettifyDiagnosticForSidebar,
  initHighlighter,
} from "@pretty-ts-errors/vscode-formatter";
import { SUPPORTED_LANGUAGE_IDS } from "../supportedLanguageIds";
import { logger } from "../logger";

const NO_DIAGNOSTICS_MESSAGE =
  "Select code with an error to show the prettified diagnostic in this view.";

const SIDEBAR_CACHE_SIZE_MAX = 100;
const sidebarHtmlCache = new Map<string, string>();

type ViewMode = "cursor" | "locked";

interface DiagnosticItem {
  html: string;
  range: vscode.Range;
}

interface PinnedError {
  html: string;
}

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

async function diagnosticToItem(
  formattedDiagnostic: FormattedDiagnostic
): Promise<DiagnosticItem> {
  const cacheKey = formattedDiagnostic.lspDiagnostic.message;
  let html = sidebarHtmlCache.get(cacheKey);
  if (!html) {
    html = await prettifyDiagnosticForSidebar(
      formattedDiagnostic.lspDiagnostic
    );
    if (sidebarHtmlCache.size > SIDEBAR_CACHE_SIZE_MAX) {
      const firstKey = sidebarHtmlCache.keys().next().value!;
      sidebarHtmlCache.delete(firstKey);
    }
    sidebarHtmlCache.set(cacheKey, html);
  }
  return {
    html,
    range: formattedDiagnostic.range,
  };
}

// TODO: adding a `MarkdownWebviewView` class would make this provider a lot simpler
class MarkdownWebviewViewProvider implements vscode.WebviewViewProvider {
  private disposables = new Map<vscode.WebviewView, vscode.Disposable[]>();
  private webview: vscode.Webview | null = null;
  private view: vscode.WebviewView | null = null;
  private mode: ViewMode = "cursor";
  private lockedContent: DiagnosticItem | null = null;
  private pinnedError: PinnedError | null = null;
  private lastContent: string | null = null;
  private skipNextSelectionChange = false;
  private skipNextEditorChange = false;
  private initialized = false;

  constructor(private readonly provider: MarkdownWebviewProvider) {}

  private async ensureInitialized() {
    if (this.initialized) {
      return;
    }

    const isDark =
      vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark ||
      vscode.window.activeColorTheme.kind ===
        vscode.ColorThemeKind.HighContrast;
    logger.info(
      `initializing highlighter with ${isDark ? "dark" : "light"} theme`
    );

    // Default to the special 'none' theme, this will still provide formatted codeblocks with readable background and text colors
    // see: https://shiki.style/themes#special-themes
    let theme: string = "none";
    let themes: ThemeRegistration[] = [];
    let langs: LanguageRegistration[] = [];

    // If the extension is running in the local extension host, expect to be able to resolve themes and languages
    if (
      this.provider.context.extension.extensionKind == vscode.ExtensionKind.UI
    ) {
      logger.info(
        `running on the UI extension host, using vscode-shiki-bridge to load themes and language grammars`
      );
      try {
        [theme, themes] = await getUserTheme();
      } catch {
        // User's theme not found in extension registry (e.g. custom themes).
        // Fall back to a built-in VS Code theme matching the user's color theme kind.
        const fallbackTheme = isDark
          ? "Default Dark Modern"
          : "Default Light Modern";
        logger.info(
          `failed to resolve the users theme, falling back to load the ${fallbackTheme} theme`
        );
        [theme, themes] = await getTheme(fallbackTheme);
      }
      langs = await getUserLangs(["type", "ts"]);
    } else {
      logger.info(
        `NOT running on the UI extension host, falling back to use bundled shiki themes and language grammars`
      );
      // if running in the remote host, fall back on the bundles vscode themes from shiki
      const bundledTheme = isDark
        ? await import("shiki/themes/dark-plus.mjs")
        : await import("shiki/themes/light-plus.mjs");
      theme = bundledTheme.default.name!;
      themes = [bundledTheme.default];

      // for typescript, fall back to the bundled grammar from shiki
      const bundledTypeScriptGrammar =
        await import("shiki/langs/typescript.mjs");
      langs = [
        ...bundledTypeScriptGrammar.default,
        // 'type' will still resolve because its part of the pretty-ts-errors extension
        ...(await getUserLangs(["type"])),
      ];
    }

    const highlighter = await createHighlighterCore({
      themes,
      langs,
      engine: createOnigurumaEngine(import("shiki/wasm")),
    });
    initHighlighter({
      codeToHtml: (code: string, options: { lang: string }) =>
        highlighter.codeToHtml(code, { ...options, theme }),
    });
    this.initialized = true;
  }

  async lockToDiagnostic(range: vscode.Range, message?: string) {
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
      const diagnostics =
        formattedDiagnosticsStore.get(activeEditor.document.uri.fsPath) ?? [];
      const diagnostic = diagnostics.find(
        (diagnostic) =>
          diagnostic.range.isEqual(range) &&
          (!message || diagnostic.lspDiagnostic.message === message)
      );
      if (diagnostic) {
        await this.ensureInitialized();
        this.mode = "locked";
        this.lockedContent = await diagnosticToItem(diagnostic);
        this.skipNextSelectionChange = true;
        this.skipNextEditorChange = true;
        this.lastContent = null;
        if (this.webview) {
          this.refresh(this.webview);
        }
      }
    }
  }

  async pinDiagnostic(range: vscode.Range, message?: string) {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) return;

    const diagnostics =
      formattedDiagnosticsStore.get(activeEditor.document.uri.fsPath) ?? [];
    const diagnostic = diagnostics.find(
      (diagnostic) =>
        diagnostic.range.isEqual(range) &&
        (!message || diagnostic.lspDiagnostic.message === message)
    );
    if (!diagnostic) return;

    await this.ensureInitialized();
    const item = await diagnosticToItem(diagnostic);

    // Toggle: if already pinned, unpin instead
    if (this.pinnedError && this.pinnedError.html === item.html) {
      this.pinnedError = null;
    } else {
      this.pinnedError = { html: item.html };
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

    const initialContent = await this.getActiveContentHtml();
    webviewView.webview.html = await this.provider.getWebviewContent(
      webviewView.webview,
      initialContent,
      ["webview-panel"]
    );

    const disposables = this.ensureDisposables(webviewView);

    webviewView.webview.options = this.provider.getWebviewOptions();
    disposables.push(
      webviewView.webview.onDidReceiveMessage(
        this.provider.createOnDidReceiveMessage()
      ),
      vscode.languages.onDidChangeDiagnostics(() =>
        // TODO: since `onDidChangeDiagnostics` fires often, we should try and avoid calling refresh based on the event uris
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
        // this event fires often, including selecting text in output windows and terminal windows
        // avoid doing unnessesary work, because it will cause noticable delays in the UI
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

    webviewView.onDidDispose(() => {
      const disposables = this.disposables.get(webviewView);
      disposables?.forEach((disposable) => disposable.dispose());
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

  private async getActiveContentHtml(): Promise<string> {
    const items = await this.getActiveDiagnosticItems();
    if (items.length === 0) return NO_DIAGNOSTICS_MESSAGE;
    return items.map((item) => item.html).join("<hr>");
  }

  private async getActiveDiagnosticItems(): Promise<DiagnosticItem[]> {
    await this.ensureInitialized();
    switch (this.mode) {
      case "cursor":
        return this.getCursorDiagnosticItems();
      case "locked":
        return this.lockedContent ? [this.lockedContent] : [];
    }
  }

  private async getCursorDiagnosticItems(): Promise<DiagnosticItem[]> {
    const activeEditor = vscode.window.activeTextEditor;
    const selection = activeEditor?.selection;
    if (!activeEditor || !selection) return [];

    const diagnostics =
      formattedDiagnosticsStore.get(activeEditor.document.uri.fsPath) ?? [];
    const selectedDiagnostics = diagnostics.filter(
      (diagnostic) => diagnostic.range.intersection(selection) !== undefined
    );
    return Promise.all(selectedDiagnostics.map((d) => diagnosticToItem(d)));
  }

  async refresh(webview: vscode.Webview) {
    if (this.view && !this.view.visible) return;

    const sections: string[] = [];

    // Render pinned error section
    if (this.pinnedError) {
      sections.push(
        `<div class="pinned-section">` +
          `<div class="pinned-header">` +
          `<span class="pinned-label">` +
          `<span class="codicon codicon-pinned"></span>` +
          ` Pinned error` +
          `</span>` +
          `<a class="unpin-button codicon codicon-close" title="Unpin error" href="command:prettyTsErrors.unpinError"></a>` +
          `</div>` +
          this.pinnedError.html +
          `</div>`
      );
      sections.push(`<hr>`);
    }

    // Render active diagnostic items
    const items = await this.getActiveDiagnosticItems();
    if (items.length === 0) {
      sections.push(NO_DIAGNOSTICS_MESSAGE);
    } else {
      for (let i = 0; i < items.length; i++) {
        if (i > 0) sections.push(`<hr>`);
        const item = items[i]!;
        if (this.pinnedError && item.html === this.pinnedError.html) {
          sections.push(
            `<div class="diagnostic-item pinned-message">` +
              `<em>This item is pinned on top.</em>` +
              `</div>`
          );
        } else {
          sections.push(`<div class="diagnostic-item">${item.html}</div>`);
        }
      }
    }

    const fullHtml = sections.join("");
    if (fullHtml !== this.lastContent) {
      webview.postMessage({ command: "update-content", html: fullHtml });
      this.lastContent = fullHtml;
    }
  }
}
