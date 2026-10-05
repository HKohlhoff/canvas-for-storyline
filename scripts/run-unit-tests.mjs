import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import esbuild from "esbuild";

const outputDir = ".test-build";
fs.rmSync(outputDir, { recursive: true, force: true });

function findTests(directory) {
  return fs.readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => entry.isDirectory() ? findTests(path.join(directory, entry.name)) : [path.join(directory, entry.name)])
    .filter((file) => file.endsWith(".test.ts"))
    .sort();
}

const tests = findTests("tests");
try {
  await esbuild.build({
    entryPoints: tests,
    outbase: "tests",
    outdir: outputDir,
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node20",
    sourcemap: false,
    logLevel: "warning"
  });
  const files = tests.map((file) => path.join(outputDir, path.relative("tests", file).replace(/\.ts$/, ".js")));
  const result = spawnSync(process.execPath, ["--test", ...files], { stdio: "inherit" });
  process.exitCode = result.status ?? 1;
} finally {
  fs.rmSync(outputDir, { recursive: true, force: true });
}
