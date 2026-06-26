import {
  createHighlighter,
  type BundledLanguage,
  type BundledTheme,
  type Highlighter,
} from "shiki";
import { ColorThemeKind, window } from "vscode";
import { logger } from "../logger";

export interface SidebarHighlightedToken {
  color: string | null;
  fontStyle: number;
  text: string;
}

export interface SidebarHighlightedLine {
  tokens: SidebarHighlightedToken[];
}

export interface SidebarCodePresentation {
  backgroundColor: string | null;
  foregroundColor: string | null;
  language: string | null;
  lines: SidebarHighlightedLine[];
}

interface SidebarSyntaxHighlighterState {
  highlighter: Highlighter;
  themeId: string;
}

type HighlighterCodeOptions = Parameters<Highlighter["codeToTokensBase"]>[1];
type HighlighterCodeLanguage = NonNullable<HighlighterCodeOptions["lang"]>;
type HighlighterCodeTheme = NonNullable<HighlighterCodeOptions["theme"]>;

const REQUIRED_LANGUAGES = [
  "typescript",
  "tsx",
  "javascript",
  "jsx",
  "json",
] as const satisfies readonly BundledLanguage[];

const DEFAULT_DARK_THEME = "dark-plus";
const DEFAULT_LIGHT_THEME = "light-plus";
const DEFAULT_HIGH_CONTRAST_DARK_THEME = "github-dark-high-contrast";
const DEFAULT_HIGH_CONTRAST_LIGHT_THEME = "github-light-high-contrast";

const presentationCache = new Map<string, SidebarCodePresentation | null>();

let state: SidebarSyntaxHighlighterState | null = null;

function cacheKey(
  themeId: string,
  language: string | null,
  code: string,
): string {
  return JSON.stringify({
    code,
    language,
    themeId,
  });
}

async function createState(): Promise<SidebarSyntaxHighlighterState> {
  const themeId = getThemeIdFromActiveTheme();
  const highlighter = await createHighlighter({
    langs: [...REQUIRED_LANGUAGES],
    themes: [themeId],
  });

  logger.debug(
    `initialized sidebar syntax highlighter with bundled shiki theme '${themeId}'`
  );

  return {
    highlighter,
    themeId,
  };
}

async function getState(): Promise<SidebarSyntaxHighlighterState> {
  const themeId = getThemeIdFromActiveTheme();
  if (state !== null && state.themeId === themeId) {
    return state;
  }

  if (state !== null) {
    logger.debug(
      `reloading sidebar syntax highlighter because the active theme changed from '${state.themeId}' to '${themeId}'`
    );
    state.highlighter.dispose();
  }

  state = await createState();
  return state;
}

function getThemeIdFromActiveTheme(): BundledTheme {
  switch (window.activeColorTheme.kind) {
    case ColorThemeKind.Light:
      return DEFAULT_LIGHT_THEME;
    case ColorThemeKind.HighContrastLight:
      return DEFAULT_HIGH_CONTRAST_LIGHT_THEME;
    case ColorThemeKind.HighContrast:
      return DEFAULT_HIGH_CONTRAST_DARK_THEME;
    case ColorThemeKind.Dark:
    default:
      return DEFAULT_DARK_THEME;
  }
}

function resolveLanguageId(
  language: string,
): HighlighterCodeLanguage | null {
  switch (language) {
    case "type":
    case "typescript":
      return "typescript";
    case "typescriptreact":
      return "tsx";
    case "javascript":
      return "javascript";
    case "javascriptreact":
      return "jsx";
    case "json":
      return "json";
    default:
      return null;
  }
}

export function invalidateSidebarSyntaxHighlighter() {
  presentationCache.clear();
  if (state !== null) {
    state.highlighter.dispose();
    state = null;
  }
}

export async function highlightSidebarCode(
  code: string,
  language: string | null,
): Promise<SidebarCodePresentation | null> {
  if (language === null) {
    return null;
  }

  try {
    const currentState = await getState();
    const resolvedLanguageId = resolveLanguageId(language);
    if (resolvedLanguageId === null) {
      logger.debug(
        `no bundled shiki language mapping was found for '${language}'`
      );
      return null;
    }

    const key = cacheKey(currentState.themeId, resolvedLanguageId, code);
    const cached = presentationCache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const tokenLines = await currentState.highlighter.codeToTokensBase(code, {
      lang: resolvedLanguageId,
      theme: currentState.themeId as HighlighterCodeTheme,
    });

    const presentation: SidebarCodePresentation = {
      backgroundColor: null,
      foregroundColor: null,
      language: resolvedLanguageId,
      lines: tokenLines.map((line) => {
        return {
          tokens: line.map((token) => {
            return {
              color: token.color ?? null,
              fontStyle: token.fontStyle ?? 0,
              text: token.content,
            };
          }),
        };
      }),
    };

    presentationCache.set(key, presentation);
    return presentation;
  } catch (error) {
    logger.warn("failed to highlight sidebar code block", error);
    return null;
  }
}
