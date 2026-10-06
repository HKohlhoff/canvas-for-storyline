import type { StoryLineCategory } from "./model/storyline";
import { normalizeVaultPath } from "./vault/path";

export type MasterSceneLinkMode = "wikilinks" | "embeds";

export interface CanvasForStoryLineSettings {
  projectPath: string;
  masterOutputPath: string;
  createMasterWithCanvases: boolean;
  masterSceneLinkMode: MasterSceneLinkMode;
  includedCategories: Record<StoryLineCategory, boolean>;
}

export const DEFAULT_SETTINGS: CanvasForStoryLineSettings = {
  projectPath: "",
  masterOutputPath: "",
  createMasterWithCanvases: true,
  masterSceneLinkMode: "wikilinks",
  includedCategories: {
    scenes: true,
    sceneNotes: true,
    characters: true,
    locations: true,
  },
};

export function normalizeSettings(value: unknown): CanvasForStoryLineSettings {
  const candidate = isRecord(value) ? value : {};
  const categories = isRecord(candidate.includedCategories) ? candidate.includedCategories : {};
  const rawPath = typeof candidate.projectPath === "string" ? candidate.projectPath.trim() : "";
  const rawMasterPath = typeof candidate.masterOutputPath === "string" ? candidate.masterOutputPath.trim() : "";
  return {
    projectPath: rawPath === "" ? "" : normalizeVaultPath(rawPath.replace(/^\/+|\/+$/g, "")),
    masterOutputPath: rawMasterPath === "" ? "" : normalizeVaultPath(rawMasterPath.replace(/^\/+|\/+$/g, "")),
    createMasterWithCanvases: readBoolean(candidate.createMasterWithCanvases, true),
    masterSceneLinkMode: candidate.masterSceneLinkMode === "embeds" ? "embeds" : "wikilinks",
    includedCategories: {
      scenes: readBoolean(categories.scenes, true),
      sceneNotes: readBoolean(categories.sceneNotes, true),
      characters: readBoolean(categories.characters, true),
      locations: readBoolean(categories.locations, true),
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}
