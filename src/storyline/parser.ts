import type { StoryLineCategory, StoryLineElement, StoryLineProject } from "../model/storyline";
import { stableId } from "../generation/identity";

export interface StoryLineSourceDocument {
  path: string;
  content: string;
}

const FOLDER_CATEGORIES: ReadonlyArray<readonly [RegExp, StoryLineCategory]> = [
  [/(^|\/)szenen-notizen(\/|$)/i, "sceneNotes"],
  [/(^|\/)scenenotes(\/|$)/i, "sceneNotes"],
  [/(^|\/)szenen(\/|$)/i, "scenes"],
  [/(^|\/)scenes(\/|$)/i, "scenes"],
  [/(^|\/)figuren(\/|$)/i, "characters"],
  [/(^|\/)characters(\/|$)/i, "characters"],
  [/(^|\/)orte(\/|$)/i, "locations"],
  [/(^|\/)locations(\/|$)/i, "locations"],
];

export function parseStoryLineProject(
  rootPath: string,
  documents: readonly StoryLineSourceDocument[],
): StoryLineProject {
  const normalizedRoot = rootPath.replace(/\/+$/g, "");
  const elements = documents
    .filter((document) => document.path.toLowerCase().endsWith(".md"))
    .filter((document) => !isGeneratedCanvasPath(normalizedRoot, document.path))
    .map((document) => parseElement(normalizedRoot, document))
    .filter((element): element is StoryLineElement => element !== null)
    .sort((left, right) => left.sourcePath.localeCompare(right.sourcePath, "de"));
  const rootSegments = normalizedRoot.split("/");
  return {
    name: rootSegments[rootSegments.length - 1] ?? normalizedRoot,
    rootPath: normalizedRoot,
    elements,
  };
}

export function isGeneratedCanvasPath(rootPath: string, path: string): boolean {
  const relative = path.slice(rootPath.length).replace(/^\/+/, "");
  return relative.split("/")[0]?.toLowerCase() === "canvas";
}

function parseElement(rootPath: string, document: StoryLineSourceDocument): StoryLineElement | null {
  const relativePath = document.path.slice(rootPath.length).replace(/^\/+/, "");
  const frontmatter = readFrontmatter(document.content);
  const category = categoryFromType(frontmatter.type) ?? categoryFromPath(relativePath);
  if (!category) return null;
  const pathSegments = relativePath.split("/");
  const basename = pathSegments[pathSegments.length - 1]?.replace(/\.md$/i, "") ?? relativePath;
  const title = frontmatter.title ?? frontmatter.name ?? firstHeading(document.content) ?? basename;
  const chapter = frontmatter.chapter ?? chapterFromPath(relativePath);
  return {
    id: stableId("storyline-element", document.path),
    category,
    title,
    sourcePath: document.path,
    chapter,
    ...optionalNumber("act", frontmatter.act),
    ...optionalNumber("sequence", frontmatter.sequence),
    ...optionalString("notesFile", frontmatter.notesFile),
    ...optionalList("characters", frontmatter.characters),
    ...optionalList("locations", [
      ...(frontmatter.locations ?? []),
      ...(frontmatter.location ? [frontmatter.location] : []),
    ]),
  };
}

function categoryFromPath(relativePath: string): StoryLineCategory | null {
  return FOLDER_CATEGORIES.find(([pattern]) => pattern.test(relativePath))?.[1] ?? null;
}

function categoryFromType(value: string | undefined): StoryLineCategory | null {
  if (!value) return null;
  const normalized = value.toLowerCase().replace(/[ _-]/g, "");
  const values: Record<string, StoryLineCategory> = {
    scene: "scenes", szene: "scenes",
    scenenote: "sceneNotes", szenennotiz: "sceneNotes",
    character: "characters", figur: "characters",
    location: "locations", ort: "locations",
  };
  return values[normalized] ?? null;
}

interface StoryLineFrontmatter {
  type?: string;
  title?: string;
  name?: string;
  chapter?: string;
  act?: string;
  sequence?: string;
  notesFile?: string;
  characters?: string[];
  location?: string;
  locations?: string[];
}

function readFrontmatter(content: string): StoryLineFrontmatter {
  const block = /^---\s*\n([\s\S]*?)\n---(?:\s*\n|$)/.exec(content)?.[1];
  if (!block) return {};
  const scalars: Record<string, string> = {};
  const lists: Record<string, string[]> = {};
  let activeList: string | null = null;
  for (const line of block.split("\n")) {
    const listItem = /^\s+-\s+(.+?)\s*$/.exec(line)?.[1];
    if (listItem && activeList) {
      (lists[activeList] ??= []).push(cleanYamlScalar(listItem));
      continue;
    }
    const match = /^([A-Za-zÄÖÜäöü_-]+):\s*(.*?)\s*$/.exec(line);
    if (!match) {
      activeList = null;
      continue;
    }
    const key = match[1]?.toLowerCase();
    const value = match[2];
    if (!key) continue;
    if (!value) {
      activeList = key;
      lists[key] ??= [];
      continue;
    }
    activeList = null;
    scalars[key] = cleanYamlScalar(value);
  }
  return {
    ...optionalString("type", scalars.type ?? scalars.typ),
    ...optionalString("title", scalars.title ?? scalars.titel),
    ...optionalString("name", scalars.name),
    ...optionalString("chapter", scalars.chapter ?? scalars.kapitel),
    ...optionalString("act", scalars.act),
    ...optionalString("sequence", scalars.sequence),
    ...optionalString("notesFile", normalizeLinkTarget(scalars.notesfile)),
    ...optionalList("characters", normalizeLinkTargets(lists.characters)),
    ...optionalString("location", normalizeLinkTarget(scalars.location)),
    ...optionalList("locations", normalizeLinkTargets(lists.locations)),
  };
}

function cleanYamlScalar(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length >= 2) {
    const first = trimmed[0];
    const last = trimmed[trimmed.length - 1];
    if ((first === "\"" && last === "\"") || (first === "'" && last === "'")) {
      return trimmed.slice(1, -1).trim();
    }
  }
  return trimmed;
}

function normalizeLinkTargets(values: string[] | undefined): string[] | undefined {
  if (!values) return undefined;
  return values.map(normalizeLinkTarget).filter((value): value is string => Boolean(value));
}

function normalizeLinkTarget(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const cleaned = cleanYamlScalar(value);
  const wikilink = /^\[\[([\s\S]+)\]\]$/.exec(cleaned)?.[1];
  return (wikilink?.split("|")[0] ?? cleaned).trim() || undefined;
}

function optionalString<Key extends string>(key: Key, value: string | undefined): Partial<Record<Key, string>> {
  return value ? { [key]: value } as Record<Key, string> : {};
}

function optionalNumber<Key extends string>(key: Key, value: string | undefined): Partial<Record<Key, number>> {
  if (!value) return {};
  const parsed = Number(value);
  return Number.isFinite(parsed) ? { [key]: parsed } as Record<Key, number> : {};
}

function optionalList<Key extends string>(key: Key, value: string[] | undefined): Partial<Record<Key, string[]>> {
  return value && value.length > 0 ? { [key]: value } as Record<Key, string[]> : {};
}

function firstHeading(content: string): string | null {
  return /^#\s+(.+)$/m.exec(content)?.[1]?.trim() ?? null;
}

function chapterFromPath(relativePath: string): string | null {
  const segments = relativePath.split("/");
  if (segments.length < 3) return null;
  return segments[1] ?? null;
}
