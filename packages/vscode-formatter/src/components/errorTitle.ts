import { d } from "@pretty-ts-errors/utils";
import { Diagnostic } from "vscode-languageserver-types";
import { t as l10nT } from "@vscode/l10n";

export const errorTitle = (
  code: Diagnostic["code"],
  actions: string,
  suffix = ""
) => d /*html*/ `
    <span style="color:#f96363;">⚠ ${l10nT("Error")} </span>${
      typeof code === "number"
        ? d /*html*/ `
            <span style="color:#5f5f5f;">
            (TS${code})
            <span class="title-actions">
            ${actions}
            </span>
            </span>
          `
        : ""
    }
    <br>
    ${suffix}
`;
