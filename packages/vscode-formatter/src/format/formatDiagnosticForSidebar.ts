import { formatDiagnosticMessage } from "@pretty-ts-errors/formatter";
import { Diagnostic } from "vscode-languageserver-types";
import { htmlCodeBlock } from "../components/htmlCodeBlock";
import {
  divider,
  pinErrorLink,
  copyErrorLink,
  errorMessageTranslationLink,
  errorCodeExplanationLink,
} from "../components/actions";
import { errorTitle } from "../components/errorTitle";
import { d } from "@pretty-ts-errors/utils";
import { embedSymbolLinks } from "./embedSymbolLinks";
import { identSentences } from "./identSentences";

/**
 * Format a diagnostic for display in the sidebar webview.
 * Uses shiki HTML code blocks (must call initHtmlCodeBlock before first use).
 */
export function formatDiagnosticForSidebar(diagnostic: Diagnostic): string {
  const newDiagnostic = embedSymbolLinks(diagnostic);

  return d/*html*/ `
    ${errorTitle(
      diagnostic.code,
      d`${pinErrorLink(diagnostic.range)} ${divider}
        ${copyErrorLink(diagnostic.message)} ${divider}
        ${errorMessageTranslationLink(diagnostic.message)} ${divider}
        ${errorCodeExplanationLink(diagnostic.code)}`
    )}
    <div style="line-height:2; padding-top: 8px;">
    ${formatDiagnosticMessage(
      identSentences(newDiagnostic.message),
      htmlCodeBlock
    )}
    </div>
  `;
}
