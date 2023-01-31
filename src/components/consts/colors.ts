import { ColorThemeKind, window } from "vscode";

const blockColors: Record<ColorThemeKind, string> = {
  [ColorThemeKind.Dark]: "#0a0a0a66",
  [ColorThemeKind.Light]: "#dcdcdc66",
  [ColorThemeKind.HighContrast]: "#000000",
  [ColorThemeKind.HighContrastLight]: "#f2f2f2",
};

export const blockColor = blockColors[window.activeColorTheme.kind];
