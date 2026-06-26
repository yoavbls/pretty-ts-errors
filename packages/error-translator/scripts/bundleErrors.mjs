import { createRequire } from "node:module";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, "..");
const errorsDir = path.join(packageRoot, "vendor", "matt-pocock", "errors");
const outputDir = path.join(packageRoot, "src", "generated");
const outputFile = path.join(outputDir, "bundleErrors.json");

function parseTranslationMarkdown(markdown, fileName) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/u.exec(markdown);

  if (match === null) {
    throw new Error(`Missing front matter in ${fileName}.`);
  }

  const body = match[2]?.trim();
  if (body === undefined || body.length === 0) {
    throw new Error(`Missing translation body in ${fileName}.`);
  }

  const originalMatch = /^original:\s*(.+)$/mu.exec(match[1]);
  if (originalMatch === null) {
    throw new Error(`Missing original diagnostic message in ${fileName}.`);
  }

  return {
    body,
    original: unwrapQuotedValue(originalMatch[1].trim()),
  };
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

function getCategoryName(category) {
  const categoryName = ts.DiagnosticCategory?.[category];
  return typeof categoryName === "string" ? categoryName : "Error";
}

function buildFallbackBody(diagnostic) {
  const categoryName = getCategoryName(diagnostic.category).toLowerCase("en");

  switch (categoryName) {
    case "suggestion":
      return `TypeScript suggests: ${diagnostic.message}`;
    case "message":
      return `TypeScript reports: ${diagnostic.message}`;
    default:
      return `TypeScript reports this error: ${diagnostic.message}`;
  }
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

async function loadCuratedTranslations() {
  const files = (await readdir(errorsDir))
    .filter((file) => file.endsWith(".md"))
    .sort((left, right) => left.localeCompare(right, "en"));

  const curatedTranslationsByCode = new Map();

  for (const fileName of files) {
    const code = Number(path.parse(fileName).name);
    if (!Number.isInteger(code)) {
      throw new Error(`Cannot derive numeric diagnostic code from ${fileName}.`);
    }

    const markdown = await readFile(path.join(errorsDir, fileName), "utf8");
    const translation = parseTranslationMarkdown(markdown, fileName);

    if (curatedTranslationsByCode.has(code)) {
      throw new Error(`Duplicate curated translation for TS${code}.`);
    }

    curatedTranslationsByCode.set(code, {
      ...translation,
      fileName,
    });
  }

  return curatedTranslationsByCode;
}

async function bundleErrors() {
  const diagnostics = getCurrentDiagnostics();
  const diagnosticsByCode = new Map(
    diagnostics.map((diagnostic) => [diagnostic.code, diagnostic]),
  );
  const curatedTranslationsByCode = await loadCuratedTranslations();

  const json = {};

  for (const [code, translation] of curatedTranslationsByCode) {
    if (!diagnosticsByCode.has(code)) {
      throw new Error(
        `Curated translation ${translation.fileName} targets removed or unknown TS${code}.`,
      );
    }
  }

  for (const diagnostic of diagnostics) {
    const curatedTranslation = curatedTranslationsByCode.get(diagnostic.code);
    if (
      curatedTranslation !== undefined &&
      curatedTranslation.original !== diagnostic.message
    ) {
      throw new Error(
        `Curated translation ${curatedTranslation.fileName} is stale for TS${diagnostic.code}. Expected "${diagnostic.message}" but found "${curatedTranslation.original}".`,
      );
    }

    json[String(diagnostic.code)] = {
      body: curatedTranslation?.body ?? buildFallbackBody(diagnostic),
      category: getCategoryName(diagnostic.category),
      code: diagnostic.code,
      message: diagnostic.message,
      source: curatedTranslation === undefined ? "generated" : "curated",
    };
  }

  await mkdir(outputDir, { recursive: true });
  await writeFile(outputFile, `${JSON.stringify(json, null, 2)}\n`, "utf8");
}

bundleErrors().catch((error) => {
  console.error(error);
  process.exit(1);
});
