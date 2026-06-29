import bundleErrors from "./generated/bundleErrors.json" with {
  type: "json",
};
import { fillBodyWithItems } from "./getImprovedMessage.js";
import { parseErrors } from "./parseErrors.js";

export type TranslationCategory = "Error" | "Message" | "Suggestion";
export type TranslationSource = "curated" | "generated";

interface TranslationEntry {
  body: string;
  category: TranslationCategory;
  code: number;
  message: string;
  source: TranslationSource;
}

type TranslationBundle = Record<string, TranslationEntry>;

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
      "category" in entry &&
      (entry.category === "Error" ||
        entry.category === "Message" ||
        entry.category === "Suggestion") &&
      "code" in entry &&
      typeof entry.code === "number" &&
      "message" in entry &&
      typeof entry.message === "string" &&
      "source" in entry &&
      (entry.source === "curated" || entry.source === "generated")
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
  category: TranslationCategory;
  code: number;
  rawError: string;
  body: string;
  source: TranslationSource;
}

function buildFallbackBody(message: string): string {
  return `TypeScript reports this diagnostic: ${message}`;
}

export function hasTranslation(code: number): boolean {
  return translationBundle[String(code)] !== undefined;
}

export function translateDiagnosticMessage(
  message: string,
): PlainEnglishTranslation[] {
  return parseErrors(message).map((error) => {
    const translation = translationBundle[String(error.code)];
    const bodyTemplate =
      translation?.body ?? buildFallbackBody(error.parseInfo.rawError);

    return {
      category: translation?.category ?? "Error",
      code: error.code,
      rawError: error.parseInfo.rawError,
      body: fillBodyWithItems(bodyTemplate, error.parseInfo.items).body,
      source: translation?.source ?? "generated",
    };
  });
}
