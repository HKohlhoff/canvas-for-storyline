import { TFile, TFolder, type Vault } from "obsidian";
import { parseStoryLineProject, type StoryLineSourceDocument } from "./parser";
import type { StoryLineProject } from "../model/storyline";

export async function readStoryLineProject(vault: Vault, rootPath: string): Promise<StoryLineProject> {
  const root = vault.getAbstractFileByPath(rootPath);
  if (!(root instanceof TFolder)) throw new Error(`StoryLine project folder not found: ${rootPath}`);
  const files = collectMarkdownFiles(root, rootPath);
  const documents: StoryLineSourceDocument[] = await Promise.all(
    files.map(async (file) => ({ path: file.path, content: await vault.cachedRead(file) })),
  );
  return parseStoryLineProject(rootPath, documents);
}

function collectMarkdownFiles(folder: TFolder, rootPath: string): TFile[] {
  const files: TFile[] = [];
  for (const child of folder.children) {
    const relative = child.path.slice(rootPath.length).replace(/^\/+/, "");
    if (relative.split("/")[0]?.toLowerCase() === "canvas") continue;
    if (child instanceof TFolder) files.push(...collectMarkdownFiles(child, rootPath));
    else if (child instanceof TFile && child.extension.toLowerCase() === "md") files.push(child);
  }
  return files.sort((left, right) => left.path.localeCompare(right.path, "de"));
}
