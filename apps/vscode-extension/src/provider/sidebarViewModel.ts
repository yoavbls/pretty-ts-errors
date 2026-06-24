import { translateDiagnosticMessage } from "@pretty-ts-errors/error-translator";
import type { Range } from "vscode";
import type { FormattedDiagnostic } from "../formattedDiagnosticsStore";

type SidebarCommandAction = {
  kind: "command";
  command: string;
  args: unknown[];
  icon: string;
  title: string;
};

type SidebarLinkAction = {
  kind: "link";
  href: string;
  icon: string;
  title: string;
};

type SidebarCopyAction = {
  kind: "copy";
  value: string;
  icon: string;
  title: string;
};

export type SidebarActionModel =
  | SidebarCommandAction
  | SidebarLinkAction
  | SidebarCopyAction;

export interface SidebarTranslationModel {
  code: number;
  rawError: string;
  body: string;
}

export interface SidebarDiagnosticModel {
  code: number | null;
  message: string;
  actions: SidebarActionModel[];
  translations: SidebarTranslationModel[];
  note?: string;
}

export interface SidebarViewModel {
  pinned: SidebarDiagnosticModel | null;
  diagnostics: SidebarDiagnosticModel[];
  emptyMessage: string;
}

function serializeRange(range: Range) {
  return {
    start: {
      line: range.start.line,
      character: range.start.character,
    },
    end: {
      line: range.end.line,
      character: range.end.character,
    },
  };
}

function createRevealAction(
  diagnostic: FormattedDiagnostic,
): SidebarCommandAction | null {
  const related = diagnostic.lspDiagnostic.relatedInformation?.[0];
  if (
    related === undefined ||
    !related.message.includes("is declared here")
  ) {
    return null;
  }

  return {
    kind: "command",
    command: "prettyTsErrors.revealSelection",
    args: [related.location.uri, related.location.range],
    icon: "codicon-go-to-file",
    title: "Go to related symbol",
  };
}

function getCodeNumber(code: FormattedDiagnostic["lspDiagnostic"]["code"]) {
  return typeof code === "number" ? code : null;
}

export function createSidebarDiagnosticModel(
  diagnostic: FormattedDiagnostic,
  options?: { note?: string },
): SidebarDiagnosticModel {
  const code = getCodeNumber(diagnostic.lspDiagnostic.code);
  const actions: SidebarActionModel[] = [
    {
      kind: "command",
      command: "prettyTsErrors.pinError",
      args: [serializeRange(diagnostic.range), diagnostic.lspDiagnostic.message],
      icon: "codicon-pinned",
      title: "Pin error",
    },
    {
      kind: "copy",
      value: diagnostic.lspDiagnostic.message,
      icon: "codicon-copy",
      title: "Copy error message",
    },
  ];

  const revealAction = createRevealAction(diagnostic);
  if (revealAction !== null) {
    actions.push(revealAction);
  }

  if (code !== null) {
    actions.push({
      kind: "link",
      href: `https://typescript.tv/errors/ts${code}`,
      icon: "codicon-link-external",
      title: `Open TS${code} documentation`,
    });
  }

  const model: SidebarDiagnosticModel = {
    code,
    message: diagnostic.lspDiagnostic.message,
    actions,
    translations: translateDiagnosticMessage(diagnostic.lspDiagnostic.message),
  };

  if (options?.note !== undefined) {
    model.note = options.note;
  }

  return model;
}
