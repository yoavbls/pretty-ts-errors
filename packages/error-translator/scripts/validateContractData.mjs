import { createRequire } from "node:module";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, "..");
const curatedErrorsDir = path.join(packageRoot, "vendor", "matt-pocock", "errors");
const generatedDir = path.join(packageRoot, "src", "generated");
const bundleFile = path.join(generatedDir, "bundleErrors.json");
const tsErrorMessagesFile = path.join(generatedDir, "tsErrorMessages.json");

function getCategoryName(category) {
  const categoryName = ts.DiagnosticCategory?.[category];
  return typeof categoryName === "string" ? categoryName : "Error";
}

function getCurrentDiagnostics() {
  return Object.values(ts.Diagnostics)
    .filter((diagnostic) => {
      return (
        typeof diagnostic === "object" &&
        diagnostic !== null &&
        typeof diagnostic.code === "number" &&
        typeof diagnostic.message === "string"
      );
    })
    .sort((left, right) => left.code - right.code);
}

function unwrapQuotedValue(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function parseOriginalMessage(markdown, fileName) {
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

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function validateTsErrorMessages(currentDiagnostics) {
  const tsErrorMessages = await readJson(tsErrorMessagesFile);

  if (Object.keys(tsErrorMessages).length !== currentDiagnostics.length) {
    throw new Error(
      `tsErrorMessages.json is stale. Expected ${currentDiagnostics.length} entries but found ${Object.keys(tsErrorMessages).length}.`,
    );
  }

  for (const diagnostic of currentDiagnostics) {
    const entry = tsErrorMessages[diagnostic.message];
    if (entry === undefined) {
      throw new Error(
        `tsErrorMessages.json is missing the current diagnostic template for TS${diagnostic.code}.`,
      );
    }

    if (
      entry.code !== diagnostic.code ||
      entry.category !== getCategoryName(diagnostic.category)
    ) {
      throw new Error(
        `tsErrorMessages.json is stale for TS${diagnostic.code}.`,
      );
    }
  }
}

async function validateCuratedOverrides(currentDiagnosticsByCode) {
  const files = (await readdir(curatedErrorsDir))
    .filter((file) => file.endsWith(".md"))
    .sort((left, right) => left.localeCompare(right, "en"));

  for (const fileName of files) {
    const code = Number(path.parse(fileName).name);
    if (!Number.isInteger(code)) {
      throw new Error(`Cannot derive numeric diagnostic code from ${fileName}.`);
    }

    const diagnostic = currentDiagnosticsByCode.get(code);
    if (diagnostic === undefined) {
      throw new Error(
        `Curated translation ${fileName} targets removed or unknown TS${code}.`,
      );
    }

    const markdown = await readFile(path.join(curatedErrorsDir, fileName), "utf8");
    const original = parseOriginalMessage(markdown, fileName);

    if (original !== diagnostic.message) {
      throw new Error(
        `Curated translation ${fileName} is stale for TS${code}. Expected "${diagnostic.message}" but found "${original}".`,
      );
    }
  }
}

async function validateBundle(currentDiagnostics) {
  const bundle = await readJson(bundleFile);

  if (Object.keys(bundle).length !== currentDiagnostics.length) {
    throw new Error(
      `bundleErrors.json is stale. Expected ${currentDiagnostics.length} entries but found ${Object.keys(bundle).length}.`,
    );
  }

  for (const diagnostic of currentDiagnostics) {
    const entry = bundle[String(diagnostic.code)];
    if (entry === undefined) {
      throw new Error(`bundleErrors.json is missing TS${diagnostic.code}.`);
    }

    if (
      entry.code !== diagnostic.code ||
      entry.category !== getCategoryName(diagnostic.category) ||
      entry.message !== diagnostic.message
    ) {
      throw new Error(`bundleErrors.json is stale for TS${diagnostic.code}.`);
    }

    if (typeof entry.body !== "string" || entry.body.length === 0) {
      throw new Error(`bundleErrors.json has an empty body for TS${diagnostic.code}.`);
    }

    if (entry.source !== "curated" && entry.source !== "generated") {
      throw new Error(
        `bundleErrors.json has an invalid source for TS${diagnostic.code}.`,
      );
    }
  }
}

async function main() {
  const currentDiagnostics = getCurrentDiagnostics();
  const currentDiagnosticsByCode = new Map(
    currentDiagnostics.map((diagnostic) => [diagnostic.code, diagnostic]),
  );

  await validateTsErrorMessages(currentDiagnostics);
  await validateCuratedOverrides(currentDiagnosticsByCode);
  await validateBundle(currentDiagnostics);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
