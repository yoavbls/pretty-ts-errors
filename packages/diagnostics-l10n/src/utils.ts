/**
 * Based on how TypeScript normalizes locales
 */
export function normalizeLocale(locale: string) {
  locale = locale.toLowerCase();
  switch (locale) {
    case "pt-br":
    case "zh-cn":
    case "zh-tw": {
      return locale;
    }
    default: {
      return locale.split("-", 1)[0] as string;
    }
  }
}
