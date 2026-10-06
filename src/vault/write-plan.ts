import { normalizePath, TFile, TFolder, type FileManager, type Vault } from "obsidian";
import { contentHash } from "../generation/identity";
import { obsoleteOwnedCanvasPaths } from "../generation/plan/obsolete";
import type { GenerationPlan } from "../generation/plan/types";
import type { ProjectOwnership } from "../plugin-data";

export interface WritePlanResult {
  ownership: ProjectOwnership;
  created: string[];
  updated: string[];
  unchanged: string[];
  conflicts: string[];
  removed: string[];
}

export async function writeGenerationPlan(
  vault: Vault,
  fileManager: FileManager,
  plan: GenerationPlan,
  previous: ProjectOwnership | undefined,
  onOwnershipChange?: (ownership: ProjectOwnership) => Promise<void>,
): Promise<WritePlanResult> {
  await ensureFolder(vault, plan.outputPath);
  const ownership: ProjectOwnership = { artifacts: { ...(previous?.artifacts ?? {}) } };
  const result: WritePlanResult = {
    ownership,
    created: [],
    updated: [],
    unchanged: [],
    conflicts: [],
    removed: [],
  };
  for (const obsoletePath of obsoleteOwnedCanvasPaths(plan, previous)) {
    const existing = vault.getAbstractFileByPath(obsoletePath);
    if (existing instanceof TFile) {
      await fileManager.trashFile(existing);
      result.removed.push(obsoletePath);
    } else if (existing) {
      result.conflicts.push(obsoletePath);
      continue;
    }
    delete ownership.artifacts[obsoletePath];
    await onOwnershipChange?.(ownership);
  }
  for (const artifact of plan.artifacts) {
    const path = normalizePath(artifact.path);
    await ensureFolder(vault, parentFolder(path));
    const desiredHash = contentHash(artifact.content);
    const existing = vault.getAbstractFileByPath(path);
    if (!existing) {
      await vault.create(path, artifact.content);
      ownership.artifacts[path] = { hash: desiredHash };
      await onOwnershipChange?.(ownership);
      result.created.push(path);
      continue;
    }
    if (!(existing instanceof TFile)) {
      result.conflicts.push(path);
      continue;
    }
    await fileManager.trashFile(existing);
    await vault.create(path, artifact.content);
    ownership.artifacts[path] = { hash: desiredHash };
    await onOwnershipChange?.(ownership);
    result.updated.push(path);
  }
  return result;
}

function parentFolder(path: string): string {
  return path.split("/").slice(0, -1).join("/");
}

async function ensureFolder(vault: Vault, folderPath: string): Promise<void> {
  const normalized = normalizePath(folderPath);
  if (!normalized) return;
  const segments = normalized.split("/");
  let current = "";
  for (const segment of segments) {
    current = current ? `${current}/${segment}` : segment;
    const existing = vault.getAbstractFileByPath(current);
    if (!existing) await vault.createFolder(current);
    else if (!(existing instanceof TFolder)) throw new Error(`A file blocks the output folder: ${current}`);
  }
}
