import { HoverProvider } from "vscode";
import { uriStore } from "./uriStore";

export const hoverProvider: HoverProvider = {
  provideHover(document, position) {
    const itemsInUriStore = uriStore[document.uri.path];

    if (!itemsInUriStore) {
      return null;
    }

    const itemInRange = itemsInUriStore.filter((item) =>
      item.range.contains(position)
    );

    return {
      range: itemInRange?.[0]?.range,
      contents: itemInRange.flatMap((item) => item.contents),
    };
  },
};
