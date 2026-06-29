import { createErrorMessagePrettifier } from "@pretty-ts-errors/formatter";
import { translateDiagnosticMessage } from "@pretty-ts-errors/error-translator";
import type { Diagnostic } from "vscode-languageserver-types";
import { htmlCodeBlock } from "../components/htmlCodeBlock.js";
import {
  divider,
  pinErrorLink,
  copyErrorLink,
  errorCodeExplanationLink,
} from "../components/actions.js";
import { errorTitle } from "../components/errorTitle.js";
import { d } from "@pretty-ts-errors/utils";
import { embedSymbolLinks } from "./embedSymbolLinks.js";
import { identSentences } from "./identSentences.js";
import { renderPlainEnglishTranslations } from "./renderPlainEnglishTranslations.js";

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
  const translations = translateDiagnosticMessage(diagnostic.message);
  const renderedTranslations = renderPlainEnglishTranslations(translations);

  return d /*html*/ `
    ${errorTitle(
      newDiagnostic.code,
      d`${pinErrorLink(newDiagnostic.range, diagnostic.message)} ${divider}
        ${copyErrorLink(newDiagnostic.message)} ${divider}
        ${errorCodeExplanationLink(newDiagnostic.code)}`
    )}
    <div style="line-height:2; padding-top: 8px;">
    ${prettifiedMessage}
    </div>
    ${renderedTranslations}
  `;
}
