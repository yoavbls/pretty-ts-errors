import { compressToEncodedURIComponent } from "lz-string";
import { Diagnostic, Range } from "vscode-languageserver-types";
import { d } from "@pretty-ts-errors/utils";

export const divider = `<span class="divider">|</span>`;

export const errorCodeExplanationLink = (errorCode: Diagnostic["code"]) =>
  d /*html*/ `
    <a title="See detailed explanation" href="https://typescript.tv/errors/ts${errorCode}">
      <span class="codicon codicon-link-external">
      </span>
    </a>`;

export const showErrorInSidebarLink = (range: Range) => {
  const args = encodeURIComponent(JSON.stringify([range]));
  return d /*html*/ `
    <a title="Show error in sidebar" href="command:prettyTsErrors.showErrorInSidebar?${args}">
      <span class="codicon codicon-layout-sidebar-left-dock">
      </span>
    </a>`;
};

export const pinErrorLink = (range: Range) => {
  const args = encodeURIComponent(JSON.stringify([range]));
  return d /*html*/ `
    <a title="Pin error" href="command:prettyTsErrors.pinError?${args}">
      <span class="codicon codicon-pinned">
      </span>
    </a>`;
};

export const copyErrorLink = (message: Diagnostic["message"]) => {
  const args = encodeURIComponent(JSON.stringify(message));
  return d /*html*/ `
    <a title="Copy error to clipboard" href="command:prettyTsErrors.copyError?${args}">
      <span class="codicon codicon-copy">
      </span>
    </a>`;
};

export const errorMessageTranslationLink = (message: Diagnostic["message"]) => {
  const encodedMessage = compressToEncodedURIComponent(message);
  return d /*html*/ `
    <a title="See translation" href="https://ts-error-translator.vercel.app/?error=${encodedMessage}">
      <span class="codicon codicon-globe">
      </span>
    </a>`;
};
