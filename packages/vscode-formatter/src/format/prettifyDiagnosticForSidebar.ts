import { createErrorMessagePrettifier } from "@pretty-ts-errors/formatter";
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

const prettifyErrorMessageForSidebar =
  createErrorMessagePrettifier(htmlCodeBlock);

/**
 * Prettify a diagnostic for display in the sidebar webview.
 * Uses shiki HTML code blocks (must call initHtmlCodeBlock before first use).
 */
export async function prettifyDiagnosticForSidebar(
  diagnostic: Diagnostic
): Promise<string> {
  const newDiagnostic = embedSymbolLinks(diagnostic);
  const identedSentences = identSentences(newDiagnostic.message);
  const prettifiedMessage =
    await prettifyErrorMessageForSidebar(identedSentences);

  return d /*html*/ `
    ${errorTitle(
      newDiagnostic.code,
      d`${pinErrorLink(newDiagnostic.range)} ${divider}
        ${copyErrorLink(newDiagnostic.message)} ${divider}
        ${errorMessageTranslationLink(newDiagnostic.message)} ${divider}
        ${errorCodeExplanationLink(newDiagnostic.code)}`
    )}
    <div style="line-height:2; padding-top: 8px;">
    ${prettifiedMessage}
    </div>
  `;
}
