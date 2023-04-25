import { Diagnostic } from "vscode-languageserver-types";
import { compressToEncodedURIComponent, d } from "../utils";
import { KNOWN_ERROR_NUMBERS } from "./consts/knownErrorNumbers";

export const title = (diagnostic: Diagnostic) => d/*html*/ `
    <span style="color:#f96363;">⚠ Error</span>${
      typeof diagnostic.code === "number"
        ? d/*html*/ `
            <span style="color:#5f5f5f;">
            (TS${diagnostic.code}) 
            ${errorCodeExplanationLink(diagnostic.code)}  | 
            ${errorMessageTranslationLink(diagnostic.message)}
            </span>
          `
        : ""
    }
    <br>
    <span>

`;

export const errorCodeExplanationLink = (errorCode: Diagnostic["code"]) =>
  KNOWN_ERROR_NUMBERS.includes(errorCode)
    ? d/*html*/ `
        <a title="See detailed explanation" href="https://typescript.tv/errors/#TS${errorCode}">
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
