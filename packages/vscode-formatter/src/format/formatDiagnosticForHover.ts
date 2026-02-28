import { formatDiagnosticMessage } from "@pretty-ts-errors/formatter";
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

/**
 * Format a diagnostic for display in hover tooltips.
 * Uses markdown fenced code blocks (required by VS Code's MarkdownString).
 */
export function formatDiagnosticForHover(diagnostic: Diagnostic) {
  const newDiagnostic = embedSymbolLinks(diagnostic);

  return d/*html*/ `
    ${errorTitle(
      diagnostic.code,
      d`${showErrorInSidebarLink(diagnostic.range)} ${divider}
        ${pinErrorLink(diagnostic.range)} ${divider}
        ${copyErrorLink(diagnostic.message)} ${divider}
        ${errorCodeExplanationLink(diagnostic.code)}`,
      miniLine
    )}
    <span>
    ${formatDiagnosticMessage(
      identSentences(newDiagnostic.message),
      hoverCodeBlock
    )}
    </span>
  `;
}
