import { compressToEncodedURIComponent } from "lz-string";
import { Diagnostic, Range } from "vscode-languageserver-types";
import { d } from "@pretty-ts-errors/utils";
import { t as l10nT } from "@vscode/l10n";

export const divider = `<span class="divider">|</span>`;

export const errorCodeExplanationLink = (errorCode: Diagnostic["code"]) =>
  d /*html*/ `
    <a title="${l10nT("See detailed explanation")}" href="https://typescript.tv/errors/ts${errorCode}">
      <span class="codicon codicon-link-external">
      </span>
    </a>`;

export const showErrorInSidebarLink = (range: Range, message?: string) => {
  const args = encodeURIComponent(
    JSON.stringify(message != null ? [range, message] : [range])
  );
  return d /*html*/ `
    <a title="${l10nT("Show error in sidebar")}" href="command:prettyTsErrors.showErrorInSidebar?${args}">
      <span class="codicon codicon-layout-sidebar-left-dock">
      </span>
    </a>`;
};

export const pinErrorLink = (range: Range, message?: string) => {
  const args = encodeURIComponent(
    JSON.stringify(message != null ? [range, message] : [range])
  );
  return d /*html*/ `
    <a title="${l10nT("Pin error")}" href="command:prettyTsErrors.pinError?${args}">
      <span class="codicon codicon-pinned">
      </span>
    </a>`;
};

export const copyErrorLink = (message: Diagnostic["message"]) => {
  const args = encodeURIComponent(JSON.stringify(message));
  return d /*html*/ `
    <a title="${l10nT("Copy error to clipboard")}" href="command:prettyTsErrors.copyError?${args}">
      <span class="codicon codicon-copy">
      </span>
    </a>`;
};

export const errorMessageTranslationLink = (message: Diagnostic["message"]) => {
  const encodedMessage = compressToEncodedURIComponent(message);
  return d /*html*/ `
    <a title="${l10nT("See translation")}" href="https://ts-error-translator.vercel.app/?error=${encodedMessage}">
      <span class="codicon codicon-globe">
      </span>
    </a>`;
};
