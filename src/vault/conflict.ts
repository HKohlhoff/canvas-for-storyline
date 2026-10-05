import { contentHash } from "../generation/identity";

export type ExistingArtifactAction = "conflict" | "unchanged" | "update";

export function decideExistingArtifactAction(
  priorHash: string | undefined,
  currentContent: string,
  desiredContent: string,
): ExistingArtifactAction {
  const currentHash = contentHash(currentContent);
  if (!priorHash || priorHash !== currentHash) return "conflict";
  return currentHash === contentHash(desiredContent) ? "unchanged" : "update";
}

export async function processOwnedArtifact(
  process: (transform: (currentContent: string) => string) => Promise<string>,
  priorHash: string | undefined,
  desiredContent: string,
): Promise<ExistingArtifactAction> {
  let action: ExistingArtifactAction | undefined;
  await process((currentContent) => {
    action = decideExistingArtifactAction(priorHash, currentContent, desiredContent);
    return action === "update" ? desiredContent : currentContent;
  });
  if (!action) throw new Error("Vault process completed without reading the artifact.");
  return action;
}
