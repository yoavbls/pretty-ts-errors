// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  {
    ignores: [
      "apps/*/scripts/**",
      "apps/*/dist/**",
      "apps/*/out/**",
      "apps/*/.vscode-test/**",
      "packages/*/scripts/**",
      "packages/*/dist/**",
      "examples/**",
      ".vscode-test/**",
    ],
  },
  {
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        ...globals.node,
        /**
         * @see https://www.npmjs.com/package/@types/vscode-webview
         */
        acquireVsCodeApi: false,
        window: false,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      curly: "warn",
      eqeqeq: ["warn", "smart"],
      "no-throw-literal": "warn",
      semi: "off",
    },
  },
  {
    files: ["apps/*/webview/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.browser,
        acquireVsCodeApi: false,
      },
    },
  }
);
