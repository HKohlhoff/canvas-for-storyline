import type { ProjectOwnership } from "../../plugin-data";
import type { GenerationPlan } from "./types";

export function obsoleteOwnedCanvasPaths(
  plan: GenerationPlan,
  previous: ProjectOwnership | undefined,
): string[] {
  const desiredCanvasPaths = new Set(
    plan.artifacts
      .map((artifact) => artifact.path)
      .filter((path) => path.toLowerCase().endsWith(".canvas")),
  );
  if (desiredCanvasPaths.size === 0) return [];
  return Object.keys(previous?.artifacts ?? {})
    .filter((path) => path.toLowerCase().endsWith(".canvas"))
    .filter((path) => parentFolder(path) === plan.outputPath)
    .filter((path) => !desiredCanvasPaths.has(path))
    .sort((left, right) => left.localeCompare(right, "de"));
}

function parentFolder(path: string): string {
  return path.split("/").slice(0, -1).join("/");
}
