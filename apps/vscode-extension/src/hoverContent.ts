import {
  createErrorMessagePrettifier,
  type CodeBlockFn,
} from "@pretty-ts-errors/formatter";
import { MarkdownString } from "vscode";
import { enabledCommands } from "./commands/enabledCommands";
import {
  createDiagnosticRichContentModel,
  renderDiagnosticBlocksToMarkdown,
  type DiagnosticRichContentModel,
} from "./diagnosticRichContent";
import type { PrettyTsLspDiagnostic } from "./lspDiagnostic";

function encodeCommandArgs(args: unknown[]): string {
  return encodeURIComponent(JSON.stringify(args));
}

function buildCommandUri(command: string, args: unknown[]): string {
  return `command:${command}?${encodeCommandArgs(args)}`;
}

function toCommandRange(range: PrettyTsLspDiagnostic["range"]) {
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

function buildRevealLink(diagnostic: PrettyTsLspDiagnostic): string | null {
  const related = diagnostic.relatedInformation?.[0];
  if (
    related === undefined ||
    !related.message.includes("is declared here")
  ) {
    return null;
  }

  const args = [
    related.location.uri,
    related.location.range,
  ];

  return `[Go to Symbol](${buildCommandUri(
    "prettyTsErrors.revealSelection",
    args,
  )})`;
}

const markdownCodeBlock: CodeBlockFn = (code, language, multiLine) => {
  const trimmedCode = code.trim();
  if (multiLine) {
    return `\n${createFencedCodeBlock(trimmedCode, language)}\n`;
  }

  return createInlineCodeBlock(trimmedCode);
};

const prettifyDiagnosticBody = createErrorMessagePrettifier(markdownCodeBlock);

function createInlineCodeBlock(code: string): string {
  const fence = code.includes("``") ? "```" : code.includes("`") ? "``" : "`";
  return `${fence}${code}${fence}`;
}

function createFencedCodeBlock(code: string, language?: string): string {
  const fence = code.includes("```") ? "````" : "```";
  const infoString = language === undefined ? "" : language;
  return `${fence}${infoString}\n${code}\n${fence}`;
}

function normalizeFormatterOutput(markdown: string): string {
  return markdown.replace(/<ul>((?:<li>[\s\S]*?<\/li>)+)<\/ul>/gu, (_match, items) => {
    const listItems = Array.from(
      items.matchAll(/<li>([\s\S]*?)<\/li>/gu),
      ([, content]) => `- ${content}`,
    );
    return `\n${listItems.join("\n")}\n`;
  });
}

export async function buildPrettyDiagnosticMessageMarkdown(
  message: string,
): Promise<string> {
  return normalizeFormatterOutput(await prettifyDiagnosticBody(message));
}

async function createBodyMarkdown(
  diagnostic: PrettyTsLspDiagnostic,
  layout?: DiagnosticRichContentModel,
  bodyMarkdown?: string,
  debugHeader?: string,
): Promise<MarkdownString> {
  const markdown = new MarkdownString();
  const content =
    layout ??
    createDiagnosticRichContentModel(
      diagnostic.code,
      diagnostic.message,
      bodyMarkdown ?? (await buildPrettyDiagnosticMessageMarkdown(diagnostic.message)),
    );

  if (debugHeader !== undefined) {
    markdown.appendMarkdown(`${debugHeader}\n\n`);
  }

  markdown.appendMarkdown(`**${content.title}**\n\n`);
  markdown.appendMarkdown(renderDiagnosticBlocksToMarkdown(content.body));

  if (content.translations.length > 0) {
    markdown.appendMarkdown("\n\n**Local explanation**");
    content.translations.forEach((translation) => {
      markdown.appendMarkdown(`\n\n**TS${translation.code}**\n\n`);
      if (
        content.translations.length > 1 ||
        translation.rawError !== diagnostic.message
      ) {
        markdown.appendCodeblock(translation.rawError, "txt");
      }
      markdown.appendMarkdown(
        `\n${renderDiagnosticBlocksToMarkdown(translation.blocks)}\n`,
      );
    });
  }

  markdown.supportHtml = false;
  return markdown;
}

function createActionsMarkdown(
  diagnostic: PrettyTsLspDiagnostic,
  documentUri?: string,
): MarkdownString {
  const range = toCommandRange(diagnostic.range);
  const links = [
    `[Show in Sidebar](${buildCommandUri(
      "prettyTsErrors.showErrorInSidebar",
      documentUri === undefined
        ? [range, diagnostic.message]
        : [documentUri, range, diagnostic.message],
    )})`,
    `[Pin](${buildCommandUri("prettyTsErrors.pinError", [
      ...(documentUri === undefined ? [] : [documentUri]),
      range,
      diagnostic.message,
    ])})`,
    `[Copy](${buildCommandUri("prettyTsErrors.copyError", [diagnostic.message])})`,
  ];

  const revealLink = buildRevealLink(diagnostic);
  if (revealLink !== null) {
    links.push(revealLink);
  }

  if (typeof diagnostic.code === "number") {
    links.push(
      `[TS${diagnostic.code} Docs](https://typescript.tv/errors/ts${diagnostic.code})`,
    );
  }

  const markdown = new MarkdownString(links.join(" | "));
  markdown.isTrusted = { enabledCommands };
  markdown.supportHtml = false;
  return markdown;
}

export async function createHoverContents(
  diagnostic: PrettyTsLspDiagnostic,
  options?: {
    bodyMarkdown?: string;
    debugHeader?: string;
    documentUri?: string;
    layout?: DiagnosticRichContentModel;
  },
): Promise<MarkdownString[]> {
  return [
    await createBodyMarkdown(
      diagnostic,
      options?.layout,
      options?.bodyMarkdown,
      options?.debugHeader,
    ),
    createActionsMarkdown(diagnostic, options?.documentUri),
  ];
}
