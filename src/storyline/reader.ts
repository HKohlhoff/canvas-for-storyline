import { TFile, TFolder, type Vault } from "obsidian";
import { parseStoryLineProject, type StoryLineSourceDocument } from "./parser";
import type { StoryLineProject, StoryLineSeriesContext } from "../model/storyline";

export async function readStoryLineProject(vault: Vault, rootPath: string): Promise<StoryLineProject> {
  const root = vault.getAbstractFileByPath(rootPath);
  if (!(root instanceof TFolder)) throw new Error(`StoryLine project folder not found: ${rootPath}`);
  const files = collectMarkdownFiles(root, rootPath);
  const seriesCodex = findSeriesCodexFolder(vault, rootPath);
  if (seriesCodex) files.push(...collectMarkdownFiles(seriesCodex, rootPath));
  const uniqueFiles = [...new Map(files.map((file) => [file.path, file])).values()]
    .sort((left, right) => left.path.localeCompare(right.path, "de"));
  const documents: StoryLineSourceDocument[] = await Promise.all(
    uniqueFiles.map(async (file) => ({ path: file.path, content: await vault.cachedRead(file) })),
  );
  const seriesContext = await readSeriesContext(vault, rootPath);
  return parseStoryLineProject(rootPath, documents, { ...seriesContext, vaultName: vault.getName() });
}

function findSeriesCodexFolder(vault: Vault, rootPath: string): TFolder | null {
  const segments = rootPath.replace(/\/+$/g, "").split("/");
  segments.pop();
  if (segments.length === 0) return null;
  const folder = vault.getAbstractFileByPath(`${segments.join("/")}/Codex`);
  return folder instanceof TFolder ? folder : null;
}

async function readSeriesContext(vault: Vault, rootPath: string): Promise<StoryLineSeriesContext> {
  const segments = rootPath.replace(/\/+$/g, "").split("/");
  const projectFolderName = segments.pop();
  if (!projectFolderName || segments.length === 0) return {};
  const seriesFile = vault.getAbstractFileByPath(`${segments.join("/")}/series.json`);
  if (!(seriesFile instanceof TFile)) return {};
  try {
    const value = JSON.parse(await vault.cachedRead(seriesFile)) as unknown;
    if (!isRecord(value)) return {};
    const bookOrder = Array.isArray(value.bookOrder)
      ? value.bookOrder.filter((item): item is string => typeof item === "string")
      : [];
    const bookIndex = bookOrder.indexOf(projectFolderName);
    return {
      ...(typeof value.name === "string" && value.name.trim() ? { seriesName: value.name.trim() } : {}),
      ...(bookIndex >= 0 ? { bookNumber: bookIndex + 1 } : {}),
    };
  } catch {
    return {};
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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
