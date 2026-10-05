import { normalizePath, TFile, TFolder, type Vault } from "obsidian";
import { contentHash } from "../generation/identity";
import type { GenerationPlan } from "../generation/plan/types";
import type { ProjectOwnership } from "../plugin-data";
import { processOwnedArtifact } from "./conflict";

export interface WritePlanResult {
  ownership: ProjectOwnership;
  created: string[];
  updated: string[];
  unchanged: string[];
  conflicts: string[];
}

export async function writeGenerationPlan(
  vault: Vault,
  plan: GenerationPlan,
  previous: ProjectOwnership | undefined,
  onOwnershipChange?: (ownership: ProjectOwnership) => Promise<void>,
): Promise<WritePlanResult> {
  await ensureFolder(vault, plan.outputPath);
  const ownership: ProjectOwnership = { artifacts: { ...(previous?.artifacts ?? {}) } };
  const result: WritePlanResult = { ownership, created: [], updated: [], unchanged: [], conflicts: [] };
  for (const artifact of plan.artifacts) {
    const path = normalizePath(artifact.path);
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
    const prior = previous?.artifacts[path];
    const action = await processOwnedArtifact(
      (transform) => vault.process(existing, transform),
      prior?.hash,
      artifact.content,
    );
    if (action === "conflict") {
      result.conflicts.push(path);
      continue;
    }
    if (action === "unchanged") {
      result.unchanged.push(path);
      continue;
    }
    ownership.artifacts[path] = { hash: desiredHash };
    await onOwnershipChange?.(ownership);
    result.updated.push(path);
  }
  return result;
}

async function ensureFolder(vault: Vault, folderPath: string): Promise<void> {
  const normalized = normalizePath(folderPath);
  const segments = normalized.split("/");
  let current = "";
  for (const segment of segments) {
    current = current ? `${current}/${segment}` : segment;
    const existing = vault.getAbstractFileByPath(current);
    if (!existing) await vault.createFolder(current);
    else if (!(existing instanceof TFolder)) throw new Error(`A file blocks the output folder: ${current}`);
  }
}
