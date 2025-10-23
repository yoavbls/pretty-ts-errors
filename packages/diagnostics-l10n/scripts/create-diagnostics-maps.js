// @ts-check

import { fileURLToPath } from "url";
import { readFile, writeFile } from "fs/promises";
import * as path from "path";

const tsVersion = "5.9.3";
const diagnosticMessagesReferenceFileUrl = `https://raw.githubusercontent.com/microsoft/TypeScript/refs/tags/v${tsVersion}/src/compiler/diagnosticMessages.json`;

/**
 * @returns {Promise<import('../src/').DiagnosticMessagesReference>}
 */
async function getDiagnosticMessagesRefererence() {
  // TODO: cache this result with version tag?
  const result = await fetch(diagnosticMessagesReferenceFileUrl);
  return result.json();
}

/**
 * Should match the typescript source code at https://github.com/microsoft/TypeScript/blob/v5.9.3/src/compiler/utilitiesPublic.ts#L685
 *
 * NOTE: the link should use the version used in {@link tsVersion}
 */
const locales = [
  "cs",
  "de",
  "es",
  "fr",
  "it",
  "ja",
  "ko",
  "pl",
  "pt-br",
  "ru",
  "tr",
  "zh-cn",
  "zh-tw",
];

/**
 * @param {string} locale
 */
function pathForLocale(locale) {
  return `${locale}/diagnosticMessages.generated.json`;
}

/**
 * should resolve to `node_modules/typescript/lib/`, where `node_modules` is the import path the nodejs runtime uses for this project.
 * needs to be this complicated because of ESM/CJS is still a mess, and having a monorepo complicates it further
 */
const typescriptLibPath = path.dirname(
  fileURLToPath(import.meta.resolve("typescript"))
);

async function getAllLocaleDiagnosticMessagesMaps() {
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
        /** @type {import('../src/').LocalizedDiagnosticeMessageMap} */
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
 * @type {import('../src/').Locale}
 */
const defaultLocale = "en";

/**
 *
 * @param {import('../src/').DiagnosticMessagesReference} diagnosticMessageReference
 * @param {{ locale: string, json: import('../src/').LocalizedDiagnosticeMessageMap }[]} localizedDiagnosticMessagesMaps
 * @returns {import('../src/').DiagnosticMessageLocalesMap}
 */
function mergeToDiagnosticMessageLocalesMap(
  diagnosticMessageReference,
  localizedDiagnosticMessagesMaps
) {
  /**
   * @type {import('../src/').DiagnosticMessageLocalesMap}
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
 * @param {import('../src/').DiagnosticMessagesReference} diagnosticMessageReference
 * @returns {import('../src/').DiagnosticMessageErrorCodeMap}
 */
function transformDiagnosticMessagesReferenceToDiagnosticMessageErrorCodeMap(
  diagnosticMessageReference
) {
  /**
   * @type {import('../src/').DiagnosticMessageErrorCodeMap}
   */
  const map = {};
  return Object.entries(diagnosticMessageReference).reduce(
    (map, [template, { code }]) => {
      if (template.includes("{0}")) {
        map[code] = template;
      }
      return map;
    },
    map
  );
}

/**
 * @param {import('../src/').LocalizedDiagnosticeMessageMap} localizedDiagnosticMessages
 * @returns {import('../src/').DiagnosticMessageErrorCodeMap}
 */
function transformLocalizedDiagnosticMessagesToDiagnosticMessageErrorCodeMap(
  localizedDiagnosticMessages
) {
  /**
   * @type {import('../src/').DiagnosticMessageErrorCodeMap}
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
      if (template.includes("{0}")) {
        map[code] = template;
      }
      return map;
    },
    map
  );
}

/**
 * ESM version of `__dirname`
 */
const dirname = fileURLToPath(new URL(".", import.meta.url));

async function main() {
  const [diagnosticMessageReference, localizedDiagnosticMessagesMaps] =
    await Promise.all([
      getDiagnosticMessagesRefererence(),
      getAllLocaleDiagnosticMessagesMaps(),
    ]);
  const result = mergeToDiagnosticMessageLocalesMap(
    diagnosticMessageReference,
    localizedDiagnosticMessagesMaps
  );
  const destinationDirectoryPath = path.join(dirname, "..", "src", "locales");
  return Promise.all([
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
}

main();
