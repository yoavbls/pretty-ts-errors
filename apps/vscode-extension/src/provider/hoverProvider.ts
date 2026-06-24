import { has } from "@pretty-ts-errors/utils";
import { HoverProvider, languages, type TextDocument, type Position } from "vscode";
import { formattedDiagnosticsStore } from "../formattedDiagnosticsStore";
import { createHoverContents } from "../hoverContent";
import { logger } from "../logger";
import { toLspDiagnostic } from "../lspDiagnostic";
import { SUPPORTED_DIAGNOSTIC_SOURCES } from "../supportedDiagnosticSources";

export const hoverProvider: HoverProvider = {
  async provideHover(document, position, _token) {
    const items = formattedDiagnosticsStore.get(document.uri.fsPath);

    if (!items) {
      logger.trace(
        `hover store miss for ${document.uri.toString(true)}, falling back to live diagnostics`
      );
      return provideLiveDiagnosticHover(document, position);
    }

    const itemInRange = items.filter((item) => item.range.contains(position));

    if (itemInRange.length === 0) {
      logger.trace(
        `hover store had no item at ${position.line}:${position.character} for ${document.uri.toString(true)}, falling back to live diagnostics`
      );
      return provideLiveDiagnosticHover(document, position);
    }

    const first = itemInRange[0];
    if (!first) {
      return null;
    }
    return {
      range: first.range,
      contents: itemInRange.flatMap((item) => item.contents),
    };
  },
};

async function provideLiveDiagnosticHover(document: TextDocument, position: Position) {
  const supportedDiagnostics = languages
    .getDiagnostics(document.uri)
    .filter((diagnostic) => {
      return (
        diagnostic.range.contains(position) &&
        diagnostic.source !== undefined &&
        has(SUPPORTED_DIAGNOSTIC_SOURCES, diagnostic.source)
      );
    });

  if (supportedDiagnostics.length === 0) {
    logger.trace(
      `no supported live diagnostics at ${position.line}:${position.character} for ${document.uri.toString(true)}`
    );
    return null;
  }

  logger.trace(
    `building live hover from ${supportedDiagnostics.length} supported diagnostics at ${position.line}:${position.character} for ${document.uri.toString(true)}`
  );

  const firstDiagnostic = supportedDiagnostics[0];
  if (firstDiagnostic === undefined) {
    return null;
  }

  const contents = await Promise.all(
    supportedDiagnostics.map((diagnostic) => {
      return createHoverContents(toLspDiagnostic(diagnostic));
    }),
  );

  return {
    range: firstDiagnostic.range,
    contents: contents.flat(),
  };
}
