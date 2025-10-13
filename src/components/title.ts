import { Diagnostic } from "vscode-languageserver-types";
import { compressToEncodedURIComponent, d } from "../utils";
import { KNOWN_ERROR_NUMBERS } from "./consts/knownErrorNumbers";
import { miniLine } from "./miniLine";
import { Uri } from 'vscode';
import { PRETTY_TS_ERRORS_SCHEME } from '../provider/textDocumentProvider';

export const title = (diagnostic: Diagnostic, uri: Uri) => d/*html*/ `
    <span style="color:#f96363;">⚠ Error </span>${
      typeof diagnostic.code === "number"
        ? d/*html*/ `
            <span style="color:#5f5f5f;">
            (TS${diagnostic.code})
            ${errorCodeExplanationLink(diagnostic.code)}  |
            ${errorMessageTranslationLink(diagnostic.message)}
            ${errorMessageInANewFile(diagnostic, uri)}
            </span>
          `
        : ""
    }
    <br>
    ${miniLine}
`;

export const errorCodeExplanationLink = (errorCode: Diagnostic["code"]) =>
  KNOWN_ERROR_NUMBERS.has(errorCode)
    ? d/*html*/ `
        <a title="See detailed explanation" href="https://typescript.tv/errors/#ts${errorCode}">
          <span class="codicon codicon-link-external">
          </span>
        </a>`
    : "";

export const errorMessageTranslationLink = (message: Diagnostic["message"]) => {
  const encodedMessage = compressToEncodedURIComponent(message);

  return d/*html*/ `
    <a title="See translation" href="https://ts-error-translator.vercel.app/?error=${encodedMessage}">
      <span class="codicon codicon-globe">
      </span>
    </a>`;
};

export const errorMessageInANewFile = (diagnostic: Diagnostic, uri: Uri) => {
  const range = `${diagnostic.range.start.line}:${diagnostic.range.start.character}-${diagnostic.range.end.line}:${diagnostic.range.end.character}`;
  const virtualFileUri = Uri.parse(`${PRETTY_TS_ERRORS_SCHEME}:${encodeURIComponent(uri.fsPath + '.md')}?range=${encodeURIComponent(range)}`);
  const args = [virtualFileUri];
  const href = Uri.parse(`command:markdown.showPreview?${encodeURIComponent(JSON.stringify(args))}`);
  return d/*html*/ `
    <a title="Open in new tab" href="${href}">
      <span class="codicon codicon-new-file">
      </span>
    </a>`;
};
