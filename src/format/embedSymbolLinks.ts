import { Diagnostic } from "vscode-languageserver-types";
import { URI } from "vscode-uri";

export function embedSymbolLinks(diagnostic: Diagnostic): Diagnostic {
  if (
    !diagnostic?.relatedInformation?.[0]?.message?.includes("is declared here")
  ) {
    return diagnostic;
  }
  const ref = diagnostic.relatedInformation[0];
  const symbol = ref?.message.match(/(?<symbol>'.*?') is declared here./)
    ?.groups?.symbol;

  if (!symbol) {
    return diagnostic;
  }
  return {
    ...diagnostic,
    message: diagnostic.message.replaceAll(
      symbol,
      `${symbol} <a href="${URI.parse(ref.location.uri).path}#${
        ref.location.range.start.line + 1
      },${
        ref.location.range.start.character + 1
      }"><span class="codicon codicon-go-to-file" ></span></a>&nbsp;`
    ),
  };
}
