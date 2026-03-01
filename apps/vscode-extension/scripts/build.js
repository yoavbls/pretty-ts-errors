const process = require("node:process");
const console = require("node:console");
const fs = require("node:fs");
const path = require("node:path");
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
    plugins: [workspacePackagesPlugin, esbuildProblemMatcherPlugin],
  });
  if (watch) {
    await ctx.watch();
  } else {
    fs.rmSync("./dist", { recursive: true, force: true });
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
 * Resolve internal workspace packages to their source files so we bundle them in watch/debug.
 * This makes changes in packages/* reflected immediately without separate watchers.
 * @type {import('esbuild').Plugin}
 */
const workspacePackagesPlugin = {
  name: "workspace-packages",
  setup(build) {
    const pkgRoot = path.resolve(__dirname, "../../../packages");
    /** @type {Record<string, string>} */
    const alias = {
      "@pretty-ts-errors/utils": path.join(pkgRoot, "utils/src/index.ts"),
      "@pretty-ts-errors/formatter": path.join(
        pkgRoot,
        "formatter/src/index.ts"
      ),
      "@pretty-ts-errors/vscode-formatter": path.join(
        pkgRoot,
        "vscode-formatter/src/index.ts"
      ),
    };
    build.onResolve(
      { filter: /^@pretty-ts-errors\/(utils|formatter|vscode-formatter)$/ },
      (args) => {
        const target = alias[args.path];
        return target ? { path: target } : undefined;
      }
    );
  },
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
