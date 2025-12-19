import { compressToEncodedURIComponent } from "lz-string";
import { Diagnostic, type Range } from "vscode-languageserver-types";
import { URI } from "vscode-uri";
import { d } from "@pretty-ts-errors/utils";
import { miniLine } from "./miniLine";

export const title = (diagnostic: Diagnostic, uri?: URI) => d/*html*/ `
    <span style="color:#f96363;">⚠ Error </span>${
      typeof diagnostic.code === "number"
        ? d/*html*/ `
            <span style="color:#5f5f5f;">
            (TS${diagnostic.code})
            ${errorCodeExplanationLink(diagnostic.code)}  |
            ${errorMessageTranslationLink(diagnostic.message)}
            ${
              uri
                ? `  | ${errorMessageOpenMarkdownPreview(
                    uri,
                    diagnostic.range
                  )}`
                : ""
            }
            ${copyErrorLink(diagnostic.message)}
            </span>
          `
        : ""
    }
    <br>
    ${miniLine}
`;

const errorCodeExplanationLink = (errorCode: Diagnostic["code"]) =>
  d/*html*/ `
    <a title="See detailed explanation" href="https://typescript.tv/errors/ts${errorCode}">
      <span class="codicon codicon-link-external">
      </span>
    </a>`;

const errorMessageTranslationLink = (message: Diagnostic["message"]) => {
  const encodedMessage = compressToEncodedURIComponent(message);

  return d/*html*/ `
    <a title="See translation" href="https://ts-error-translator.vercel.app/?error=${encodedMessage}">
      <span class="codicon codicon-globe">
      </span>
    </a>`;
};

const PRETTY_TS_ERRORS_SCHEME = "pretty-ts-errors";

const errorMessageOpenMarkdownPreview = (uri: URI, range: Range) => {
  const rangeParameter = `${range.start.line}:${range.start.character}-${range.end.line}:${range.end.character}`;
  const virtualFileUri = URI.parse(
    `${PRETTY_TS_ERRORS_SCHEME}:${encodeURIComponent(
      uri.fsPath + ".md"
    )}?range=${encodeURIComponent(rangeParameter)}`
  );
  const args = [virtualFileUri];
  const href = URI.parse(
    `command:prettyTsErrors.openMarkdownPreview?${encodeURIComponent(
      JSON.stringify(args)
    )}`
  );
  return d/*html*/ `
    <a title="Open in new tab" href="${href}">
      <span class="codicon codicon-open-preview">
      </span>
    </a>`;
};

const copyErrorLink = (message: Diagnostic["message"]) => {
  const args = encodeURIComponent(JSON.stringify(message));
  return d/*html*/ `
    <a title="Copy error to clipboard" href="command:prettyTsErrors.copyError?${args}">
      <span class="codicon codicon-copy">
      </span>
    </a>`;
};
