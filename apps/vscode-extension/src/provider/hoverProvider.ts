import { HoverProvider } from "vscode";
import { uriStore } from "./uriStore";

export const hoverProvider: HoverProvider = {
  provideHover(document, position, _token) {
    const itemsInUriStore = uriStore.get(document.uri.fsPath);

    if (!itemsInUriStore) {
      return null;
    }

    const itemInRange = itemsInUriStore.filter((item) =>
      item.range.contains(position)
    );

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
