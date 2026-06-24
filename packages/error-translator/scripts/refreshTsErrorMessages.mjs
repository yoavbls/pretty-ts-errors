import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, "..");
const outputDir = path.join(packageRoot, "src", "generated");
const outputFile = path.join(outputDir, "tsErrorMessages.json");

function getCategoryName(category) {
  const categoryName = ts.DiagnosticCategory?.[category];
  return typeof categoryName === "string" ? categoryName : "Error";
}

function buildTsErrorMessageDb() {
  const diagnostics = Object.values(ts.Diagnostics)
    .filter((diagnostic) => {
      return (
        typeof diagnostic === "object" &&
        diagnostic !== null &&
        typeof diagnostic.code === "number" &&
        typeof diagnostic.message === "string"
      );
    })
    .sort((left, right) => left.code - right.code);

  const database = {};

  for (const diagnostic of diagnostics) {
    database[diagnostic.message] = {
      category: getCategoryName(diagnostic.category),
      code: diagnostic.code,
    };
  }

  return database;
}

async function main() {
  await mkdir(outputDir, { recursive: true });
  const database = buildTsErrorMessageDb();
  await writeFile(outputFile, `${JSON.stringify(database, null, 2)}\n`, "utf8");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
