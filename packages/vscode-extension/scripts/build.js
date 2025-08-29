const process = require("node:process");
const console = require("node:console");
const production = process.argv.includes("--production");
const watch = process.argv.includes("--watch");

/**
 * @see https://code.visualstudio.com/api/working-with-extensions/bundling-extension#using-esbuild
 */
async function main() {
  const ctx = await require("esbuild").context({
    entryPoints: {
      extension: "./src/extension.ts",
    },
    bundle: true,
    outdir: "./dist",
    external: ["vscode"],
    format: "cjs",
    inject: ["./scripts/process-shim.js"],
    tsconfig: "./tsconfig.json",
    define: production ? { "process.env.NODE_ENV": '"production"' } : undefined,
    minify: production,
    sourcemap: !production,
    plugins: [nodeDepsPlugin, esbuildProblemMatcherPlugin],
  });
  if (watch) {
    await ctx.watch();
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }
}

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
  name: "esbuild-problem-matcher",
  setup(build) {
    build.onStart(() => {
      console.log("[watch] build started");
    });
    build.onEnd((result) => {
      result.errors.forEach(({ text, location }) => {
        console.error(`✘ [ERROR] ${text}`);
        console.error(
          `    ${location.file}:${location.line}:${location.column}:`
        );
      });
      console.log("[watch] build finished");
    });
  },
};

/**
 * @type {import('esbuild').Plugin}
 */
const nodeDepsPlugin = {
  name: "node-deps",
  setup(build) {
    build.onResolve({ filter: /^path$/ }, (args) => {
      const path = require.resolve("../node_modules/path-browserify", {
        paths: [__dirname],
      });
      return { path };
    });
  },
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
