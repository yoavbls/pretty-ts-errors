(async () => {
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
    define: process.argv.includes("--production")
      ? { "process.env.NODE_ENV": '"production"' }
      : undefined,
    minify: process.argv.includes("--production"),
    sourcemap: !process.argv.includes("--production"),
    plugins: [
      {
        name: "node-deps",
        setup(build) {
          build.onResolve({ filter: /^path$/ }, (args) => {
            const path = require.resolve("../node_modules/path-browserify", {
              paths: [__dirname],
            });
            return { path };
          });
        },
      },
    ],
  });
  if (process.argv.includes("--watch")) {
    await ctx.watch();
    console.log("watching...");
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }
})();
