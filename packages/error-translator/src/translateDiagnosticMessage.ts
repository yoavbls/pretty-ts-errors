import bundleErrors from "./generated/bundleErrors.json";
import { fillBodyWithItems } from "./getImprovedMessage";
import { parseErrors } from "./parseErrors";

type TranslationBundle = Record<string, { body: string; code: number }>;

function isTranslationBundle(value: unknown): value is TranslationBundle {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return Object.values(value).every((entry) => {
    return (
      typeof entry === "object" &&
      entry !== null &&
      "body" in entry &&
      typeof entry.body === "string" &&
      "code" in entry &&
      typeof entry.code === "number"
    );
  });
}

function ensureTranslationBundle(value: unknown): TranslationBundle {
  if (!isTranslationBundle(value)) {
    throw new Error("Plain-English translation bundle has an invalid shape.");
  }

  return value;
}

const translationBundle = ensureTranslationBundle(bundleErrors);

export interface PlainEnglishTranslation {
  code: number;
  rawError: string;
  body: string | null;
}

export function hasTranslation(code: number): boolean {
  return translationBundle[String(code)] !== undefined;
}

export function translateDiagnosticMessage(
  message: string,
): PlainEnglishTranslation[] {
  return parseErrors(message).map((error) => {
    const translation = translationBundle[String(error.code)];

    return {
      code: error.code,
      rawError: error.parseInfo.rawError,
      body:
        translation === undefined
          ? null
          : fillBodyWithItems(translation.body, error.parseInfo.items).body,
    };
  });
}
