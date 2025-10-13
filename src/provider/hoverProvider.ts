import { HoverProvider } from "vscode";
import { uriStore } from "./uriStore";

export const hoverProvider: HoverProvider = {
  provideHover(document, position) {
    const itemsInUriStore = uriStore.get(document.uri.fsPath);

    if (!itemsInUriStore) {
      return null;
    }

    const itemsInRange = itemsInUriStore.filter((item) =>
      item.range!.contains(position)
    );

    if (itemsInRange.length === 0) {
      return;
    }

    return {
      range: itemsInRange[0].range,
      contents: itemsInRange.flatMap((item) => item.contents),
    };
  },
};
