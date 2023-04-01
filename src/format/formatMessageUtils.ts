import dedent from "ts-dedent";
import { Diagnostic } from "vscode";

export const embedSymbolLinks = (diagnostic: Diagnostic): Diagnostic => {
  if (
    !diagnostic?.relatedInformation?.[0]?.message?.includes("is declared here")
  ) {
    return diagnostic;
  }
  const ref = diagnostic.relatedInformation[0];
  const symbol = ref?.message.match(/(?<symbol>'.*?') is declared here./)
    ?.groups?.symbol!;

  if (!symbol) {
    return diagnostic;
  }
  return {
    ...diagnostic,
    message: diagnostic.message.replaceAll(
      symbol,
      `${symbol} <a href="${ref.location.uri.path}#${
        ref.location.range.start.line + 1
      },${
        ref.location.range.start.character + 1
      }"><span class="codicon codicon-go-to-file" ></span></a>&nbsp;`
    ),
  };
};

export const identSentences = (message: string): string => {
  return message
    .split("\n")
    .map((line, i) => {
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

      return dedent/*html*/ `
        </span>
        <p></p>
        <span>
        <table>
        <tr>
        <td>
        ${"&nbsp;&nbsp;&nbsp;".repeat(whiteSpacesCount)}
        <span class="codicon codicon-indent"></span>
        &nbsp;&nbsp;
        </td>
        <td>${line}</td>
        </tr>
        </table>
  `;
    })
    .join("");
};
