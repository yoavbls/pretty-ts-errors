import { Diagnostic } from "vscode";

export const embedSymbolLinks = (
  message: string,
  diagnostic: Diagnostic
): string => {
  if (
    !diagnostic?.relatedInformation?.[0]?.message?.includes("is declared here")
  ) {
    return message;
  }
  const ref = diagnostic.relatedInformation[0];
  const symbol = ref?.message.match(/(?<symbol>'.*?') is declared here./)
    ?.groups?.symbol!;

  return message.replaceAll(
    symbol,
    `${symbol} <a href="${ref.location.uri.path}#${
      ref.location.range.start.line + 1
    },${ref.location.range.start.character + 1}">      
        <span class="codicon codicon-go-to-file" ></span>
        </a>&nbsp;`
  );
};

export const identSentences = (message: string): string => {
  return message
    .split("\n")
    .map((line, i) => {
      if (i === 0) {
        return line;
      }
      return `
  </span>
  <p></p>
  <span>
  <table>
  <tr>
  <td>${"&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;".repeat(
    i - 1
  )}<span class="codicon codicon-indent"></span>&nbsp;&nbsp;</td>
  <td>${line}</td>
  </tr>
  </table>
  `;
    })
    .join("");
};
