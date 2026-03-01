import { createErrorMessagePrettifier } from "@pretty-ts-errors/formatter";
import { Diagnostic } from "vscode-languageserver-types";
import {
  divider,
  showErrorInSidebarLink,
  pinErrorLink,
  copyErrorLink,
  errorCodeExplanationLink,
} from "../components/actions";
import { errorTitle } from "../components/errorTitle";
import { miniLine } from "../components/miniLine";
import { d } from "@pretty-ts-errors/utils";
import { embedSymbolLinks } from "./embedSymbolLinks";
import { identSentences } from "./identSentences";
import { hoverCodeBlock } from "../components/hoverCodeBlock";

const prettifyErrorMessageForHover =
  createErrorMessagePrettifier(hoverCodeBlock);

/**
 * Prettify a diagnostic for display in hover tooltips.
 * Uses markdown fenced code blocks (required by VS Code's MarkdownString).
 */
export async function prettifyDiagnosticForHover(
  diagnostic: Diagnostic
): Promise<string> {
  const newDiagnostic = embedSymbolLinks(diagnostic);
  const identedSentences = identSentences(newDiagnostic.message);
  const prettifiedMessage =
    await prettifyErrorMessageForHover(identedSentences);

  return d /*html*/ `
    ${errorTitle(
      newDiagnostic.code,
      d`${showErrorInSidebarLink(newDiagnostic.range)} ${divider}
        ${pinErrorLink(newDiagnostic.range)} ${divider}
        ${copyErrorLink(newDiagnostic.message)} ${divider}
        ${errorCodeExplanationLink(newDiagnostic.code)}`,
      miniLine
    )}
    <span>
    ${prettifiedMessage}
    </span>
  `;
}
