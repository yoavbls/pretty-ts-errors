import { Diagnostic } from "vscode-languageserver-types";
import { compressToEncodedURIComponent, d } from "../utils";
import { KNOWN_ERROR_NUMBERS } from "./consts/knownErrorNumbers";
import { miniLine } from "./miniLine";
import { Output } from "../types";

export const title = (diagnostic: Diagnostic, output: Output = "html") => {
  switch (output) {
    case "html":
      return d/*html*/ `
        <span style="color:#f96363;">⚠ Error </span>${
          typeof diagnostic.code === "number"
            ? d/*html*/ `
                <span style="color:#5f5f5f;">
                (TS${diagnostic.code}) 
                ${errorCodeExplanationLink(diagnostic.code, output)}  | 
                ${errorMessageTranslationLink(diagnostic.message, output)}
                </span>
              `
            : ""
        }
        <br>
        ${miniLine}
`;
    case "plaintext":
      return d`${diagnostic.message}`;
  }
};

export const errorCodeExplanationLink = (
  errorCode: Diagnostic["code"],
  output: Output = "html"
) =>
  KNOWN_ERROR_NUMBERS.has(errorCode)
    ? d/*html*/ `
        <a title="See detailed explanation" href="https://typescript.tv/errors/#ts${errorCode}">
          <span class="codicon codicon-link-external">
          </span>
        </a>`
    : "";

export const errorMessageTranslationLink = (
  message: Diagnostic["message"],
  output: Output = "html"
) => {
  const encodedMessage = compressToEncodedURIComponent(message);

  return d/*html*/ `
    <a title="See translation" href="https://ts-error-translator.vercel.app/?error=${encodedMessage}">
      <span class="codicon codicon-globe">
      </span>
    </a>`;
};
