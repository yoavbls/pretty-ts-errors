// @ts-check

import { fileURLToPath } from "url";
import * as path from "path";
import { locales } from "./constants.js";
import { readFile, writeFile } from "fs/promises";

import { getAnnotatedTemplate } from "../dist/annotate.js";

/**
 * ESM version of `__dirname`
 */
const dirname = fileURLToPath(new URL(".", import.meta.url));
const messageMapDirectoryPath = path.join(dirname, "..", "src", "locales");

/**
 *
 * @param {string} locale
 */
async function annotateLocale(locale) {
  const contents = await readFile(
    path.join(messageMapDirectoryPath, `diagnosticMessagesMap.${locale}.json`),
    { encoding: "utf-8" }
  );
  /**
   * @type {import('../src/reference.js').DiagnosticMessageMap}
   */
  const json = JSON.parse(contents);

  // const json = {
  //   // json-literal
  //   1480: 'To convert this file to an ECMAScript module, change its file extension to \'{0}\' or create a local package.json file with `{ "type": "module" }`.',
  //   1483: 'To convert this file to an ECMAScript module, create a local package.json file with `{ "type": "module" }`.',
  //   // json-key-value-pair
  //   1481: "To convert this file to an ECMAScript module, change its file extension to '{0}', or add the field `\"type\": \"module\"` to '{1}'.",
  //   1482: 'To convert this file to an ECMAScript module, add the field `"type": "module"` to \'{0}\'.',
  //   5101: "Option '{0}' is deprecated and will stop functioning in TypeScript {1}. Specify compilerOption '\"ignoreDeprecations\": \"{2}\"' to silence this error.",
  //   5107: "Option '{0}={1}' is deprecated and will stop functioning in TypeScript {2}. Specify compilerOption '\"ignoreDeprecations\": \"{3}\"' to silence this error.",
  // };

  /**
   * @type {Record<string, import('../src/annotate.js').AnnotatedTemplate>}
   */
  const map = {};
  for (const [code, template] of Object.entries(json)) {
    const annotated = getAnnotatedTemplate(template);
    map[code] = annotated;
  }
  const text = JSON.stringify(map, null, 2);
  await writeFile(
    path.join(
      messageMapDirectoryPath,
      `diagnosticMessagesMap.${locale}.annotated.json`
    ),
    text
  );

  Object.entries(map).forEach(([code, part]) => {
    if (
      part.some(
        (part) =>
          part.type === "text" &&
          part.annotations.some((annotation) =>
            annotation.type.startsWith("json")
          )
      )
    ) {
      console.log(`${locale} with ${code} has json annotations`);
    }
  });
}

/**
 *
 * @param  {string[]} args
 * @returns {Promise<number>}
 */
async function main(...args) {
  let locale;
  if (args[0] === "--locale") {
    locale = args[1];
    if (!locales.includes(locale) && locale !== "en") {
      console.error(
        `invalid locale: '${
          locale ?? "<missing argument>"
        }', valid locales are: [${locales.join(", ")}]`
      );
      return 1;
    }
  }
  const localesToAnalyze = locale ? [locale] : locales;

  const tasks = localesToAnalyze.map(async (locale) => {
    const analytics = annotateLocale(locale);
  });

  const results = await Promise.allSettled(tasks);
  const hasErrors = results.some((result) => result.status === "rejected");

  return hasErrors ? 1 : 0;
}

main(...process.argv.slice(2)).then((code) => (process.exitCode = code));
