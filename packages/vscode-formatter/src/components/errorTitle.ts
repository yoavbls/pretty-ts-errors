import { d } from "@pretty-ts-errors/utils";
import { Diagnostic } from "vscode-languageserver-types";

export const errorTitle = (
  code: Diagnostic["code"],
  actions: string,
  suffix = ""
) => d /*html*/ `
    <span style="color:#f96363;">⚠ Error </span>${
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
