import { createRequire } from "node:module";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import bundleErrors from "../src/generated/bundleErrors.json";
import tsErrorMessages from "../src/generated/tsErrorMessages.json";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const curatedErrorsDir = path.join(
  packageRoot,
  "vendor",
  "matt-pocock",
  "errors"
);

interface TsDiagnostic {
  category: number;
  code: number;
  message: string;
}

interface TsErrorMessageEntry {
  category: string;
  code: number;
}

interface BundleEntry {
  body: string;
  category: string;
  code: number;
  message: string;
  source: string;
}

function getCategoryName(category: number): string {
  const categoryName = ts.DiagnosticCategory?.[category];
  return typeof categoryName === "string" ? categoryName : "Error";
}

function isTsDiagnostic(diagnostic: unknown): diagnostic is TsDiagnostic {
  return (
    typeof diagnostic === "object" &&
    diagnostic !== null &&
    "code" in diagnostic &&
    typeof diagnostic.code === "number" &&
    "message" in diagnostic &&
    typeof diagnostic.message === "string" &&
    "category" in diagnostic &&
    typeof diagnostic.category === "number"
  );
}

function getCurrentDiagnostics(): TsDiagnostic[] {
  return Object.values(ts.Diagnostics)
    .filter(isTsDiagnostic)
    .sort((left, right) => left.code - right.code);
}

function unwrapQuotedValue(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function parseOriginalMessage(markdown: string, fileName: string): string {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/u.exec(markdown);
  if (match === null) {
    throw new Error(`Missing front matter in ${fileName}.`);
  }

  const originalMatch = /^original:\s*(.+)$/mu.exec(match[1]);
  if (originalMatch === null) {
    throw new Error(`Missing original diagnostic message in ${fileName}.`);
  }

  return unwrapQuotedValue(originalMatch[1].trim());
}

describe("translator contract", () => {
  it("keeps tsErrorMessages.json aligned with the installed TypeScript diagnostics", () => {
    const currentDiagnostics = getCurrentDiagnostics();
    const messageDb = tsErrorMessages as Record<string, TsErrorMessageEntry>;

    expect(Object.keys(messageDb)).toHaveLength(currentDiagnostics.length);

    currentDiagnostics.forEach((diagnostic) => {
      expect(messageDb[diagnostic.message]).toEqual({
        category: getCategoryName(diagnostic.category),
        code: diagnostic.code,
      });
    });
  });

  it("keeps bundleErrors.json complete for all current TypeScript diagnostics", () => {
    const currentDiagnostics = getCurrentDiagnostics();
    const diagnosticsByCode = new Map(
      currentDiagnostics.map((diagnostic) => [diagnostic.code, diagnostic])
    );
    const bundle = bundleErrors as Record<string, BundleEntry>;
    const bundleEntries = Object.values(bundle).sort((left, right) => {
      return left.code - right.code;
    });

    expect(bundleEntries).toHaveLength(currentDiagnostics.length);
    expect(bundleEntries.map((entry) => entry.code)).toEqual(
      currentDiagnostics.map((diagnostic) => diagnostic.code)
    );

    bundleEntries.forEach((entry) => {
      const diagnostic = diagnosticsByCode.get(entry.code);
      expect(diagnostic).toBeDefined();
      expect(entry.body.length).toBeGreaterThan(0);
      expect(entry.category).toBe(getCategoryName(diagnostic?.category ?? 1));
      expect(entry.message).toBe(diagnostic?.message);
      expect(["curated", "generated"]).toContain(entry.source);
    });
  });

  it("keeps curated translation overrides aligned with current TypeScript messages", async () => {
    const currentDiagnostics = new Map(
      getCurrentDiagnostics().map((diagnostic) => [diagnostic.code, diagnostic])
    );
    const files = (await readdir(curatedErrorsDir))
      .filter((file) => file.endsWith(".md"))
      .sort((left, right) => left.localeCompare(right, "en"));

    for (const fileName of files) {
      const code = Number(path.parse(fileName).name);
      expect(Number.isInteger(code)).toBe(true);

      const diagnostic = currentDiagnostics.get(code);
      expect(diagnostic).toBeDefined();

      const markdown = await readFile(
        path.join(curatedErrorsDir, fileName),
        "utf8"
      );
      const original = parseOriginalMessage(markdown, fileName);

      expect(original).toBe(diagnostic?.message);
    }
  });
});
