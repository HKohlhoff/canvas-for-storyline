import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import esbuild from "esbuild";

const outputDir = ".demo-build";
const outputFile = path.join(outputDir, "generate-demo-vault.mjs");
fs.rmSync(outputDir, { recursive: true, force: true });

try {
  await esbuild.build({
    entryPoints: ["scripts/generate-demo-vault.ts"],
    outfile: outputFile,
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node20",
    sourcemap: false,
    logLevel: "warning",
  });
  const result = spawnSync(process.execPath, [outputFile], { stdio: "inherit" });
  process.exitCode = result.status ?? 1;
} finally {
  fs.rmSync(outputDir, { recursive: true, force: true });
}
