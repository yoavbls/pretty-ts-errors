import diagnosticPatterns from "./diagnosticPatterns.generated.json";

type Lang =
  (typeof diagnosticPatterns)[keyof typeof diagnosticPatterns][number]["lang"];
export type Translation = Partial<Record<Lang, string>> & { fallback: string };

export const nMore: Translation = {
  fallback: "+ {numTruncatedProperties} ...",
  en: "and {numTruncatedProperties} more...",
  ja: "その他 {numTruncatedProperties} 個...",
};

export const typeKeywords = [
  // English
  "type",
  "type alias",
  "interface",
  "module",
  "file",
  "file name",
  "method's",
  "subtype of constraint",
  // Japanese
  "型",
  "型エイリアス",
  "型のエイリアス",
  "インターフェイス",
  "モジュール",
  "ファイル",
  "ファイル名",
  "メソッド",
];
