// @ts-check

import { fileURLToPath } from "url";
import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import * as path from "path";

import { locales } from "./constants.js";

const tsVersion = "5.9.3";
const diagnosticMessagesReferenceFileUrl = `https://raw.githubusercontent.com/microsoft/TypeScript/refs/tags/v${tsVersion}/src/compiler/diagnosticMessages.json`;

/**
 * should resolve to `node_modules/typescript/lib/`, similar to an import statement
 */
const typescriptLibPath = path.dirname(
  fileURLToPath(import.meta.resolve("typescript"))
);

const nodeModulesPathPart = `${path.sep}node_modules${path.sep}`;
/**
 * should resolve to the path of `node_modules/` similar to an import statements
 */
const nodeModulesPath = typescriptLibPath.slice(
  0,
  typescriptLibPath.indexOf(nodeModulesPathPart) + nodeModulesPathPart.length
);

/**
 * @returns {Promise<import('../src/index.js').DiagnosticMessagesReference>}
 */
async function getDiagnosticMessagesRefererence() {
  let contents;
  const cacheFileName = `diagnosticMessages.${tsVersion}.json`;
  const cacheDirPath = path.join(nodeModulesPath, ".cache", "pretty-ts-errors");
  const cacheFilePath = path.join(cacheDirPath, cacheFileName);
  if (!existsSync(cacheFilePath)) {
    await mkdir(cacheDirPath, { recursive: true });
    const response = await fetch(diagnosticMessagesReferenceFileUrl);
    contents = await response.text();
    await writeFile(cacheFilePath, contents);
  } else {
    contents = await readFile(cacheFilePath, { encoding: "utf-8" });
  }
  return JSON.parse(contents);
}

/**
 * @param {string} locale
 */
function pathForLocale(locale) {
  return `${locale}/diagnosticMessages.generated.json`;
}

async function getLocaleDiagnosticMessagesMaps() {
  return Promise.all(
    locales
      .map((locale) => {
        return {
          locale,
          path: path.join(typescriptLibPath, pathForLocale(locale)),
        };
      })
      .map(async ({ locale, path }) => {
        const text = await readFile(path, { encoding: "utf-8" });
        /** @type {import('../src/index.js').LocalizedDiagnosticeMessageMap} */
        const json = JSON.parse(text);
        return {
          locale,
          json,
        };
      })
  );
}

/**
 * The locale the diagnostic messages reference file is written into
 * @type {import('../src/index.js').Locale}
 */
const defaultLocale = "en";

/**
 *
 * @param {import('../src/index.js').DiagnosticMessagesReference} diagnosticMessageReference
 * @param {{ locale: string, json: import('../src/index.js').LocalizedDiagnosticeMessageMap }[]} localizedDiagnosticMessagesMaps
 * @returns {import('../src/index.js').DiagnosticMessageLocalesMap}
 */
function mergeToDiagnosticMessageLocalesMap(
  diagnosticMessageReference,
  localizedDiagnosticMessagesMaps
) {
  /**
   * @type {import('../src/index.js').DiagnosticMessageLocalesMap}
   */
  // @ts-ignore
  const result = {};
  result[defaultLocale] =
    transformDiagnosticMessagesReferenceToDiagnosticMessageErrorCodeMap(
      diagnosticMessageReference
    );
  localizedDiagnosticMessagesMaps.forEach(({ locale, json }) => {
    // @ts-ignore
    result[locale] =
      transformLocalizedDiagnosticMessagesToDiagnosticMessageErrorCodeMap(json);
  });
  return result;
}

/**
 * @param {import('../src/index.js').DiagnosticMessagesReference} diagnosticMessageReference
 * @returns {import('../src/index.js').DiagnosticMessageMap}
 */
function transformDiagnosticMessagesReferenceToDiagnosticMessageErrorCodeMap(
  diagnosticMessageReference
) {
  /**
   * @type {import('../src/index.js').DiagnosticMessageMap}
   */
  const map = {};
  return Object.entries(diagnosticMessageReference).reduce(
    (map, [template, { code }]) => {
      // if (template.includes("{0}")) {
      map[code] = template;
      // }
      return map;
    },
    map
  );
}

/**
 * @param {import('../src/index.js').LocalizedDiagnosticeMessageMap} localizedDiagnosticMessages
 * @returns {import('../src/index.js').DiagnosticMessageMap}
 */
function transformLocalizedDiagnosticMessagesToDiagnosticMessageErrorCodeMap(
  localizedDiagnosticMessages
) {
  /**
   * @type {import('../src/index.js').DiagnosticMessageMap}
   */
  const map = {};
  return Object.entries(localizedDiagnosticMessages).reduce(
    (map, [identifier, template]) => {
      const parts = identifier.split("_");
      const code = Number(parts[parts.length - 1]);
      if (Number.isNaN(code)) {
        console.warn(
          `identifier has malformed or NaN error code: ${identifier}`
        );
      }
      if (code < 1000) {
        console.warn(
          `identifier did not result into a valid code '${code}': ${identifier}`
        );
      }
      // if (template.includes("{0}")) {
      map[code] = template;
      // }
      return map;
    },
    map
  );
}

/**
 * ESM version of `__dirname`
 */
const dirname = fileURLToPath(new URL(".", import.meta.url));
const destinationDirectoryPath = path.join(dirname, "..", "src", "locales");

/**
 * @param  {string[]} args
 * @returns {Promise<number>}
 */
async function main(...args) {
  const [diagnosticMessageReference, localizedDiagnosticMessagesMaps] =
    await Promise.all([
      getDiagnosticMessagesRefererence(),
      getLocaleDiagnosticMessagesMaps(),
    ]);
  const result = mergeToDiagnosticMessageLocalesMap(
    diagnosticMessageReference,
    localizedDiagnosticMessagesMaps
  );
  await Promise.all([
    writeFile(
      path.join(destinationDirectoryPath, "diagnosticMessagesMap.json"),
      JSON.stringify(result, null, 2),
      { encoding: "utf-8" }
    ),
    Object.entries(result).map(([locale, result]) => {
      return writeFile(
        path.join(
          destinationDirectoryPath,
          `diagnosticMessagesMap.${locale}.json`
        ),
        JSON.stringify(result, null, 2),
        { encoding: "utf-8" }
      );
    }),
  ]);
  return 0;
}

main(...process.argv.slice(2)).then((code) => (process.exitCode = code));
