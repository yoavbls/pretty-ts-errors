import type { Range } from "vscode";
import type {
  DiagnosticBlockNode,
  DiagnosticCodeBlockNode,
  DiagnosticInlineNode,
  DiagnosticLinkNode,
  DiagnosticPropertyListNode,
  DiagnosticTextNode,
  DiagnosticTranslationContentModel,
  DiagnosticTypeBlockNode,
} from "../diagnosticRichContent";
import type { FormattedDiagnostic } from "../formattedDiagnosticsStore";
import { formatSidebarInlineType } from "./sidebarInlineTypeFormatter";
import {
  highlightSidebarCode,
  type SidebarCodePresentation,
} from "./sidebarSyntaxHighlighter";

interface SidebarCommandAction {
  kind: "command";
  command: string;
  args: unknown[];
  icon: string;
  title: string;
}

interface SidebarLinkAction {
  kind: "link";
  href: string;
  icon: string;
  title: string;
}

interface SidebarCopyAction {
  kind: "copy";
  value: string;
  icon: string;
  title: string;
}

export type SidebarActionModel =
  | SidebarCommandAction
  | SidebarLinkAction
  | SidebarCopyAction;

export interface SidebarInlineCodeNode {
  kind: "inlineCode";
  language: string | null;
  multiline: boolean;
  presentation: SidebarCodePresentation | null;
  text: string;
}

export type SidebarInlineNode =
  | DiagnosticTextNode
  | DiagnosticLinkNode
  | SidebarInlineCodeNode;

export interface SidebarParagraphNode {
  kind: "paragraph";
  lines: SidebarInlineNode[][];
}

export interface SidebarListNode {
  kind: "list";
  items: SidebarInlineNode[][];
}

export interface SidebarCodeBlockNode extends DiagnosticCodeBlockNode {
  presentation: SidebarCodePresentation | null;
}

export interface SidebarTypeBlockNode extends DiagnosticTypeBlockNode {
  presentation: SidebarCodePresentation | null;
}

export type SidebarBlockNode =
  | SidebarParagraphNode
  | SidebarListNode
  | SidebarCodeBlockNode
  | SidebarTypeBlockNode
  | DiagnosticPropertyListNode;

export interface SidebarTranslationModel {
  code: number;
  blocks: SidebarBlockNode[];
  rawError: string;
}

export interface SidebarDiagnosticModel {
  body: SidebarBlockNode[];
  code: number | null;
  message: string;
  title: string;
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
  diagnostic: FormattedDiagnostic
): SidebarCommandAction | null {
  const related = diagnostic.lspDiagnostic.relatedInformation?.[0];
  if (related === undefined || !related.message.includes("is declared here")) {
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

async function mapInlineNodeForSidebar(
  node: DiagnosticInlineNode
): Promise<SidebarInlineNode> {
  switch (node.kind) {
    case "text":
    case "link":
      return node;
    case "inlineCode": {
      const { multiline, text } = formatSidebarInlineType(node.text);
      const language = multiline ? "type" : null;
      const presentation =
        language === null ? null : await highlightSidebarCode(text, language);

      return {
        kind: "inlineCode",
        language,
        multiline,
        presentation,
        text,
      };
    }
  }
}

async function mapInlineNodeLinesForSidebar(
  lines: DiagnosticInlineNode[][]
): Promise<SidebarInlineNode[][]> {
  return Promise.all(
    lines.map((line) =>
      Promise.all(line.map((node) => mapInlineNodeForSidebar(node)))
    )
  );
}

async function mapBlockForSidebar(
  block: DiagnosticBlockNode
): Promise<SidebarBlockNode> {
  switch (block.kind) {
    case "paragraph":
      return {
        kind: "paragraph",
        lines: await mapInlineNodeLinesForSidebar(block.lines),
      } satisfies SidebarParagraphNode;
    case "list":
      return {
        kind: "list",
        items: await mapInlineNodeLinesForSidebar(block.items),
      } satisfies SidebarListNode;
    case "codeBlock":
      return {
        ...block,
        presentation: await highlightSidebarCode(block.code, block.language),
      } satisfies SidebarCodeBlockNode;
    case "typeBlock":
      return {
        ...block,
        presentation: await highlightSidebarCode(block.code, block.language),
      } satisfies SidebarTypeBlockNode;
    case "propertyList":
      return block;
  }
}

async function mapBlocksForSidebar(
  blocks: DiagnosticBlockNode[]
): Promise<SidebarBlockNode[]> {
  return Promise.all(blocks.map((block) => mapBlockForSidebar(block)));
}

export async function createSidebarDiagnosticModel(
  diagnostic: FormattedDiagnostic,
  options?: { note?: string }
): Promise<SidebarDiagnosticModel> {
  const code = getCodeNumber(diagnostic.lspDiagnostic.code);
  const actions: SidebarActionModel[] = [
    {
      kind: "command",
      command: "prettyTsErrors.pinError",
      args: [
        diagnostic.documentUri.toString(),
        serializeRange(diagnostic.range),
        diagnostic.lspDiagnostic.message,
      ],
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

  const translations: SidebarTranslationModel[] = await Promise.all(
    diagnostic.layout.translations.map(
      async (translation: DiagnosticTranslationContentModel) => {
        return {
          blocks: await mapBlocksForSidebar(translation.blocks),
          code: translation.code,
          rawError: translation.rawError,
        };
      }
    )
  );

  const model: SidebarDiagnosticModel = {
    body: await mapBlocksForSidebar(diagnostic.layout.body),
    code,
    message: diagnostic.lspDiagnostic.message,
    title: diagnostic.layout.title,
    actions,
    translations,
  };

  if (options?.note !== undefined) {
    model.note = options.note;
  }

  return model;
}
