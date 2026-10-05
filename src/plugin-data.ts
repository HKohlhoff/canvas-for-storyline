import { DEFAULT_SETTINGS, normalizeSettings, type CanvasForStoryLineSettings } from "./settings-data";

export interface OwnedArtifact {
  hash: string;
}

export interface ProjectOwnership {
  artifacts: Record<string, OwnedArtifact>;
}

export interface CanvasForStoryLineData {
  settings: CanvasForStoryLineSettings;
  projects: Record<string, ProjectOwnership>;
}

export function normalizePluginData(value: unknown): CanvasForStoryLineData {
  const candidate = isRecord(value) ? value : {};
  return {
    settings: normalizeSettings(candidate.settings ?? DEFAULT_SETTINGS),
    projects: normalizeProjects(candidate.projects),
  };
}

function normalizeProjects(value: unknown): Record<string, ProjectOwnership> {
  if (!isRecord(value)) return {};
  const projects: Record<string, ProjectOwnership> = {};
  for (const [projectPath, rawProject] of Object.entries(value)) {
    if (!isRecord(rawProject) || !isRecord(rawProject.artifacts)) continue;
    const artifacts: Record<string, OwnedArtifact> = {};
    for (const [path, rawArtifact] of Object.entries(rawProject.artifacts)) {
      if (isRecord(rawArtifact) && typeof rawArtifact.hash === "string") {
        artifacts[path] = { hash: rawArtifact.hash };
      }
    }
    projects[projectPath] = { artifacts };
  }
  return projects;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
