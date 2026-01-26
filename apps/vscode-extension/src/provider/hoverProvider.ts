import { HoverProvider } from "vscode";
import { formattedDiagnosticsStore } from "../formattedDiagnosticsStore";

export const hoverProvider: HoverProvider = {
  provideHover(document, position, _token) {
    const items = formattedDiagnosticsStore.get(document.uri.fsPath);

    if (!items) {
      return null;
    }

    const itemInRange = items.filter((item) => item.range.contains(position));

    if (itemInRange.length === 0) {
      return null;
    }

    const first = itemInRange[0];
    if (!first) {
      return null;
    }
    return {
      range: first.range,
      contents: itemInRange.flatMap((item) => item.contents),
    };
  },
};
