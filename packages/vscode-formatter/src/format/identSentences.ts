import { d } from "@pretty-ts-errors/utils";

export const identSentences = (message: string): string =>
  message
    .split("\n")
    .map((line) => {
      let whiteSpacesCount = line.search(/\S/);
      if (whiteSpacesCount === -1) {
        whiteSpacesCount = 0;
      }
      if (whiteSpacesCount === 0) {
        return line;
      }
      if (whiteSpacesCount >= 2) {
        whiteSpacesCount -= 2;
      }

      return d /*html*/ `
        </span>
        <p></p>
        <span>
        <table>
        <tr>
        <td>
        ${"&nbsp;".repeat(3).repeat(whiteSpacesCount)}
        <span class="codicon codicon-indent"></span>
        &nbsp;&nbsp;
        </td>
        <td>${line}</td>
        </tr>
        </table>
    `;
    })
    .join("");
