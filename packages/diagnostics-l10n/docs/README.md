# Documentation for `@pretty-ts-errors/diagnostics-l10n`

## `create-diagnostic-maps.js`

This script does the following:

- if the arguments (in order) `--locale <locale>` are given, it will only run for that locale
- else it will run for all locales, defined by `locales` and the `en` locale.
- checks for a cached `diagnosticMessages.json` on the local file system in `node_modules/.cache/pretty-ts-errors/diagnosticMessages.${tsVersion}.json`.
- if not found, download the [`diagnosticMessages.json`](https://raw.githubusercontent.com/microsoft/TypeScript/main/src/compiler/diagnosticMessages.json) based on `${tsVersion}` file and cache it.
- read the `diagnosticMessages.generated.json` files for the locales in `locales` from the local file system in `node_modules/typescript/lib`:
  - `cs`
  - `de`
  - `es`
  - `fr`
  - `it`
  - `ja`
  - `ko`
  - `pl`
  - `pt-br`
  - `ru`
  - `tr`
  - `zh-cn`
  - `zh-tw`
- create a json file **containing** each locale (`diagnosticMessages.json` as `en`) at `src/locales/diagnosticMessagesMap.json`.
- create a seperate json file **for** each locale (`diagnosticMessages.json` as `en`) at `src/locales/diagnosticMessagesMap.${locale}.json`.

## `annotate-diagnostic-maps.js`

This script does the following:

- if the arguments (in order) `--locale <locale>` are given, it will only run for that locale
- else it will run for all locales, defined by `locales` and the `en` locale.
