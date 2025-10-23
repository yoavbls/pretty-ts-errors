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
    ?.groups?.["symbol"];

  if (!symbol) {
    return diagnostic;
  }

  const args = [URI.parse(ref.location.uri), ref.location.range];
  const href = URI.parse(
    `command:prettyTsErrors.revealSelection?${encodeURIComponent(
      JSON.stringify(args)
    )}`
  );

  return {
    ...diagnostic,
    message: diagnostic.message.replaceAll(
      symbol,
      `${symbol} <a href="${href}" title="Go to symbol"><span class="codicon codicon-go-to-file" ></span></a>&nbsp;`
    ),
  };
}
