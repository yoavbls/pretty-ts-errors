import { translateDiagnosticMessage } from "@pretty-ts-errors/error-translator";
import { Diagnostic } from "vscode-languageserver-types";
import { URI } from "vscode-uri";

function encodeCommandArgs(args: unknown[]): string {
  return encodeURIComponent(JSON.stringify(args));
}

function buildCommandUri(command: string, args: unknown[]): string {
  return `command:${command}?${encodeCommandArgs(args)}`;
}

function toCommandRange(range: Diagnostic["range"]) {
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

function codeLabel(code: Diagnostic["code"]): string {
  return typeof code === "number" ? ` (TS${code})` : "";
}

function buildRevealLink(diagnostic: Diagnostic): string | null {
  const related = diagnostic.relatedInformation?.[0];
  if (
    related === undefined ||
    !related.message.includes("is declared here")
  ) {
    return null;
  }

  const args = [
    URI.parse(related.location.uri).toString(),
    related.location.range,
  ];

  return `[Go to Symbol](${buildCommandUri(
    "prettyTsErrors.revealSelection",
    args,
  )})`;
}

/**
 * Prettify a diagnostic for display in hover tooltips.
 * Uses plain markdown only, so the extension does not need `supportHtml`.
 */
export async function prettifyDiagnosticForHover(
  diagnostic: Diagnostic
): Promise<string> {
  const range = toCommandRange(diagnostic.range);
  const commandLinks = [
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
    commandLinks.push(revealLink);
  }

  if (typeof diagnostic.code === "number") {
    commandLinks.push(
      `[TS${diagnostic.code} Docs](https://typescript.tv/errors/ts${diagnostic.code})`,
    );
  }

  const sections = [
    `**Error${codeLabel(diagnostic.code)}**`,
    "",
    commandLinks.join(" | "),
    "",
    "```txt",
    diagnostic.message,
    "```",
  ];

  const translations = translateDiagnosticMessage(diagnostic.message);
  if (translations.length > 0) {
    sections.push("", "**Local explanation**");

    translations.forEach((translation) => {
      if (translations.length > 1 || translation.rawError !== diagnostic.message) {
        sections.push("", `**TS${translation.code}**`, "", "```txt", translation.rawError, "```");
      } else {
        sections.push("", `**TS${translation.code}**`);
      }

      sections.push("", translation.body);
    });
  }

  return sections.join("\n");
}
