import { createHighlighter, type Highlighter } from "shiki";
import { getLanguages, getUserTheme } from "vscode-shiki-bridge";
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
  languages: Awaited<ReturnType<typeof getLanguages>>;
}

type HighlighterCodeOptions = Parameters<Highlighter["codeToTokensBase"]>[1];
type HighlighterCodeLanguage = NonNullable<HighlighterCodeOptions["lang"]>;
type HighlighterCodeTheme = NonNullable<HighlighterCodeOptions["theme"]>;

const REQUIRED_LANGUAGE_IDS = [
  "type",
  "typescript",
  "typescriptreact",
  "javascript",
  "javascriptreact",
  "json",
] as const;

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
  const [themeId, themes] = await getUserTheme();
  const languages = await getLanguages([...REQUIRED_LANGUAGE_IDS]);
  const highlighter = await createHighlighter({
    langs: languages.langs,
    themes,
  });

  logger.debug(
    `initialized sidebar syntax highlighter for theme '${themeId}' with ${languages.langs.length} language registration(s)`
  );

  return {
    highlighter,
    themeId,
    languages,
  };
}

async function getState(): Promise<SidebarSyntaxHighlighterState> {
  const [themeId] = await getUserTheme();
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

function resolveLanguageId(
  languages: SidebarSyntaxHighlighterState["languages"],
  language: string,
): HighlighterCodeLanguage | null {
  const resolvedAlias = languages.resolveAlias(language);
  const registration =
    languages.get(resolvedAlias) ?? languages.get(language);

  return (registration?.name as HighlighterCodeLanguage | undefined) ?? null;
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
    const resolvedLanguageId = resolveLanguageId(currentState.languages, language);
    if (resolvedLanguageId === null) {
      logger.debug(
        `no sidebar syntax highlighting language registration was found for '${language}'`
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
