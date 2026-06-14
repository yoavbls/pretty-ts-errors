import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["test/**/*.vitest.{ts,tsx}", "test/**/*.spec.{ts,tsx}"],
    coverage: {
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: [],
    },
  },
});
