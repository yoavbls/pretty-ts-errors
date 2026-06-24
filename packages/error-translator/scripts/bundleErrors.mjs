import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

  return { body };
}

async function bundleErrors() {
  const files = (await readdir(errorsDir))
    .filter((file) => file.endsWith(".md"))
    .sort((left, right) => left.localeCompare(right, "en"));

  const json = {};

  for (const fileName of files) {
    const code = Number(path.parse(fileName).name);
    if (!Number.isInteger(code)) {
      throw new Error(`Cannot derive numeric diagnostic code from ${fileName}.`);
    }

    const markdown = await readFile(path.join(errorsDir, fileName), "utf8");
    const { body } = parseTranslationMarkdown(markdown, fileName);

    json[String(code)] = {
      body,
      code,
    };
  }

  await mkdir(outputDir, { recursive: true });
  await writeFile(outputFile, `${JSON.stringify(json, null, 2)}\n`, "utf8");
}

bundleErrors().catch((error) => {
  console.error(error);
  process.exit(1);
});
