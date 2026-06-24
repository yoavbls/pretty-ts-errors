import { translateDiagnosticMessage } from "@pretty-ts-errors/error-translator";
import { MarkdownString } from "vscode";
import { enabledCommands } from "./commands/enabledCommands";
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

function codeLabel(code: PrettyTsLspDiagnostic["code"]): string {
  return typeof code === "number" ? ` (TS${code})` : "";
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

function createBodyMarkdown(
  diagnostic: PrettyTsLspDiagnostic,
  debugHeader?: string,
): MarkdownString {
  const markdown = new MarkdownString();

  if (debugHeader !== undefined) {
    markdown.appendMarkdown(`${debugHeader}\n\n`);
  }

  markdown.appendMarkdown(`**Error${codeLabel(diagnostic.code)}**\n\n`);
  markdown.appendCodeblock(diagnostic.message, "txt");

  const translations = translateDiagnosticMessage(diagnostic.message);
  if (translations.length > 0) {
    markdown.appendMarkdown("\n\n**Local explanation**");
    translations.forEach((translation) => {
      markdown.appendMarkdown(`\n\n**TS${translation.code}**\n\n`);
      if (translations.length > 1 || translation.rawError !== diagnostic.message) {
        markdown.appendCodeblock(translation.rawError, "txt");
      }
      markdown.appendMarkdown(`\n${translation.body}\n`);
    });
  }

  markdown.supportHtml = false;
  return markdown;
}

function createActionsMarkdown(diagnostic: PrettyTsLspDiagnostic): MarkdownString {
  const range = toCommandRange(diagnostic.range);
  const links = [
    `[Show in Sidebar](${buildCommandUri(
      "prettyTsErrors.showErrorInSidebar",
      [range, diagnostic.message],
    )})`,
    `[Pin](${buildCommandUri("prettyTsErrors.pinError", [
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

export function createHoverContents(
  diagnostic: PrettyTsLspDiagnostic,
  options?: { debugHeader?: string },
): MarkdownString[] {
  return [
    createBodyMarkdown(diagnostic, options?.debugHeader),
    createActionsMarkdown(diagnostic),
  ];
}
