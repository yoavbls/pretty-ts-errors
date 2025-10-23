import type {
  DiagnosticMessageErrorCodeMap,
  DiagnosticMessageLocalesMap,
  Locale,
} from ".";
import { normalizeLocale } from "./utils";

import { default as localesMap } from "./locales/diagnosticMessagesMap.json";

export function loadSync(): DiagnosticMessageLocalesMap;
export function loadSync<TLocale extends Locale>(
  locale: TLocale
): DiagnosticMessageErrorCodeMap;
export function loadSync<TLocale extends Locale>(
  locale?: TLocale
): DiagnosticMessageLocalesMap | DiagnosticMessageErrorCodeMap {
  if (!locale) {
    return localesMap;
  }
  const normalizedLocale = normalizeLocale(locale);
  return localesMap[normalizedLocale as keyof typeof localesMap];
}
