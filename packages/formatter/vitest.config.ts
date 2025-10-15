import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["test/**/*.vitest.{ts,tsx}", "test/**/*.spec.{ts,tsx}"],
  },
  resolve: {
    alias: [
      {
        // Map direct src imports of the sibling vscode-formatter package
        find: "@pretty-ts-errors/vscode-formatter/src",
        replacement: path.resolve(__dirname, "../vscode-formatter/src"),
      },
      {
        // Map the package root to its src index for local testing
        find: "@pretty-ts-errors/vscode-formatter",
        replacement: path.resolve(
          __dirname,
          "../vscode-formatter/src/index.ts"
        ),
      },
    ],
  },
});
