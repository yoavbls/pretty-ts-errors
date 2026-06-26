import { spawnSync } from "node:child_process";
import { constants as fsConstants } from "node:fs";
import { access, cp, mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const require = createRequire(import.meta.url);

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(scriptDir, "..");
const workspaceRoot = path.resolve(appRoot, "../..");
const distDir = path.join(appRoot, "dist");
const manifestPath = path.join(appRoot, "package.json");
const workspacePolicyPath = path.join(workspaceRoot, "pnpm-workspace.yaml");
const artifactsDir = path.join(workspaceRoot, "artifacts", "vsix");

async function pathExists(targetPath) {
  try {
    await access(targetPath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function materializeCatalogSpecifiers(dependencyMap, catalog) {
  if (dependencyMap === undefined) {
    return undefined;
  }

  const materialized = {};

  for (const [packageName, specifier] of Object.entries(dependencyMap)) {
    if (specifier === "catalog:") {
      const catalogVersion = catalog[packageName];
      if (typeof catalogVersion !== "string" && typeof catalogVersion !== "number") {
        throw new Error(
          `Missing exact catalog version for ${packageName} in pnpm-workspace.yaml`
        );
      }
      materialized[packageName] = String(catalogVersion);
      continue;
    }

    if (specifier.startsWith("workspace:")) {
      continue;
    }

    materialized[packageName] = specifier;
  }

  return Object.keys(materialized).length > 0 ? materialized : undefined;
}

async function copyIfPresent(sourcePath, destinationPath) {
  if (await pathExists(sourcePath)) {
    await cp(sourcePath, destinationPath, { recursive: true, force: true });
  }
}

async function main() {
  if (!(await pathExists(distDir))) {
    throw new Error("Extension bundle is missing. Run the production build before packaging.");
  }

  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const workspacePolicy = parseYaml(await readFile(workspacePolicyPath, "utf8"));
  const catalog = workspacePolicy.catalog ?? {};

  const stagedManifest = structuredClone(manifest);
  stagedManifest.dependencies = materializeCatalogSpecifiers(
    manifest.dependencies,
    catalog
  );
  delete stagedManifest.devDependencies;
  delete stagedManifest.browser;

  const stageDir = await mkdtemp(
    path.join(os.tmpdir(), "pretty-ts-errors-vsix-stage-")
  );

  try {
    await mkdir(artifactsDir, { recursive: true });

    await cp(distDir, path.join(stageDir, "dist"), {
      recursive: true,
      force: true,
    });

    await copyIfPresent(
      path.join(appRoot, "assets"),
      path.join(stageDir, "assets")
    );
    await copyIfPresent(
      path.join(appRoot, "syntaxes"),
      path.join(stageDir, "syntaxes")
    );
    await copyIfPresent(
      path.join(appRoot, "webview"),
      path.join(stageDir, "webview")
    );
    await copyIfPresent(
      path.join(appRoot, ".vscodeignore"),
      path.join(stageDir, ".vscodeignore")
    );
    await copyIfPresent(
      path.join(workspaceRoot, "README.md"),
      path.join(stageDir, "README.md")
    );
    await copyIfPresent(
      path.join(workspaceRoot, "LICENSE"),
      path.join(stageDir, "LICENSE")
    );
    await copyIfPresent(
      path.join(workspaceRoot, "CHANGELOG.md"),
      path.join(stageDir, "CHANGELOG.md")
    );

    await writeFile(
      path.join(stageDir, "package.json"),
      `${JSON.stringify(stagedManifest, null, 2)}\n`,
      "utf8"
    );

    const vscePackageRoot = path.dirname(
      require.resolve("@vscode/vsce/package.json")
    );
    const vsceDependencyRoot = path.resolve(vscePackageRoot, "..", "..");
    const vsceCliPath = require.resolve("@vscode/vsce/vsce");

    await symlink(
      vsceDependencyRoot,
      path.join(stageDir, "node_modules"),
      process.platform === "win32" ? "junction" : "dir"
    );

    const outputFile = path.join(
      artifactsDir,
      `${manifest.name}-${manifest.version}.vsix`
    );

    const result = spawnSync(
      process.execPath,
      [vsceCliPath, "package", "--no-dependencies", "--out", outputFile],
      {
        cwd: stageDir,
        env: {
          ...process.env,
          NODE_PATH: vsceDependencyRoot,
        },
        stdio: "inherit",
      }
    );

    if (result.status !== 0) {
      throw new Error(
        `VSIX packaging failed with exit code ${result.status ?? "unknown"}`
      );
    }
  } finally {
    await rm(stageDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
