import type {
  DiagnosticMessageErrorCodeMap,
  DiagnosticMessageLocalesMap,
} from ".";

export async function load(): Promise<DiagnosticMessageLocalesMap>;
export async function load(
  locale: string
): Promise<DiagnosticMessageErrorCodeMap>;
export async function load(
  locale?: string
): Promise<DiagnosticMessageLocalesMap | DiagnosticMessageErrorCodeMap> {
  if (!locale) {
    const exports = await import("./locales/diagnosticMessagesMap.json", {
      with: { type: "json" },
    });
    return exports.default as DiagnosticMessageLocalesMap;
  }
  const normalizedLocale = normalizeLocale(locale);
  switch (normalizedLocale) {
    case "cs":
    case "de":
    case "en":
    case "es":
    case "fr":
    case "it":
    case "ja":
    case "ko":
    case "pl":
    case "pt-br":
    case "ru":
    case "tr":
    case "zh-cn":
    case "zh-tw": {
      const exports = await import(
        `./locales/diagnosticMessagesMap.${normalizedLocale}.json`,
        {
          with: { type: "json" },
        }
      );
      return exports.default as DiagnosticMessageErrorCodeMap;
    }
    default: {
      throw new TypeError(`no mapping for locale: ${locale}`);
    }
  }
}

function normalizeLocale(locale: string) {
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
