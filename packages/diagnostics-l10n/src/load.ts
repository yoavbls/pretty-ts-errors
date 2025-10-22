import type {
  DiagnosticMessageErrorCodeMap,
  DiagnosticMessageLocalesMap,
  Locale,
} from ".";

export async function load(): Promise<DiagnosticMessageLocalesMap>;
export async function load<TLocale extends Locale>(
  locale: TLocale
): Promise<DiagnosticMessageErrorCodeMap>;
export async function load<TLocale extends Locale>(
  locale?: TLocale
): Promise<DiagnosticMessageLocalesMap | DiagnosticMessageErrorCodeMap> {
  if (!locale) {
    const exports = await import("./locales/diagnosticMessagesMap.json", {
      with: { type: "json" },
    });
    return exports.default as DiagnosticMessageLocalesMap;
  }
  const normalizedLocale = normalizeLocale(locale);
  switch (normalizedLocale) {
    case "cs": {
      const exports = await import(`./locales/diagnosticMessagesMap.cs.json`, {
        with: { type: "json" },
      });
      return exports.default as DiagnosticMessageErrorCodeMap;
    }
    case "de": {
      const exports = await import(`./locales/diagnosticMessagesMap.de.json`, {
        with: { type: "json" },
      });
      return exports.default as DiagnosticMessageErrorCodeMap;
    }
    case "en": {
      const exports = await import(`./locales/diagnosticMessagesMap.en.json`, {
        with: { type: "json" },
      });
      return exports.default as DiagnosticMessageErrorCodeMap;
    }
    case "es": {
      const exports = await import(`./locales/diagnosticMessagesMap.es.json`, {
        with: { type: "json" },
      });
      return exports.default as DiagnosticMessageErrorCodeMap;
    }
    case "fr": {
      const exports = await import(`./locales/diagnosticMessagesMap.fr.json`, {
        with: { type: "json" },
      });
      return exports.default as DiagnosticMessageErrorCodeMap;
    }
    case "it": {
      const exports = await import(`./locales/diagnosticMessagesMap.it.json`, {
        with: { type: "json" },
      });
      return exports.default as DiagnosticMessageErrorCodeMap;
    }
    case "ja": {
      const exports = await import(`./locales/diagnosticMessagesMap.ja.json`, {
        with: { type: "json" },
      });
      return exports.default as DiagnosticMessageErrorCodeMap;
    }
    case "ko": {
      const exports = await import(`./locales/diagnosticMessagesMap.ko.json`, {
        with: { type: "json" },
      });
      return exports.default as DiagnosticMessageErrorCodeMap;
    }
    case "pl": {
      const exports = await import(`./locales/diagnosticMessagesMap.pl.json`, {
        with: { type: "json" },
      });
      return exports.default as DiagnosticMessageErrorCodeMap;
    }
    case "pt-br": {
      const exports = await import(
        `./locales/diagnosticMessagesMap.pt-br.json`,
        {
          with: { type: "json" },
        }
      );
      return exports.default as DiagnosticMessageErrorCodeMap;
    }
    case "ru": {
      const exports = await import(`./locales/diagnosticMessagesMap.ru.json`, {
        with: { type: "json" },
      });
      return exports.default as DiagnosticMessageErrorCodeMap;
    }
    case "tr": {
      const exports = await import(`./locales/diagnosticMessagesMap.tr.json`, {
        with: { type: "json" },
      });
      return exports.default as DiagnosticMessageErrorCodeMap;
    }
    case "zh-cn": {
      const exports = await import(
        `./locales/diagnosticMessagesMap.zh-cn.json`,
        {
          with: { type: "json" },
        }
      );
      return exports.default as DiagnosticMessageErrorCodeMap;
    }
    case "zh-tw": {
      const exports = await import(
        `./locales/diagnosticMessagesMap.zh-tw.json`,
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
