import { Diagnostic } from "vscode";
import { KNOWN_ERROR_NUMBERS } from "./knownErrorNumbers";

export const errorCodeExternalExplanation = (errorCode: Diagnostic["code"]) => {
  if (KNOWN_ERROR_NUMBERS.includes(errorCode)) {
    return `<a href="https://typescript.tv/errors/#TS${errorCode}"><span class="codicon codicon-link-external"></span></a>`;
  } else {
    return "";
  }
};
