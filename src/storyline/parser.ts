import type {
  StoryLineCategory,
  StoryLineElement,
  StoryLineProject,
  StoryLineSeriesContext,
} from "../model/storyline";
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
  seriesContext: StoryLineSeriesContext = {},
): StoryLineProject {
  const normalizedRoot = rootPath.replace(/\/+$/g, "");
  const projectMetadata = findProjectMetadata(documents);
  const elements = documents
    .filter((document) => document.path.toLowerCase().endsWith(".md"))
    .filter((document) => !isGeneratedCanvasPath(normalizedRoot, document.path))
    .map((document) => parseElement(normalizedRoot, document))
    .filter((element): element is StoryLineElement => element !== null)
    .sort((left, right) => left.sourcePath.localeCompare(right.sourcePath, "de"));
  const rootSegments = normalizedRoot.split("/");
  return {
    name: projectMetadata.title ?? rootSegments[rootSegments.length - 1] ?? normalizedRoot,
    ...optionalString("language", projectMetadata.language),
    ...optionalString("vaultName", seriesContext.vaultName),
    ...optionalString("seriesName", seriesContext.seriesName ?? projectMetadata.seriesId),
    ...(seriesContext.bookNumber === undefined ? {} : { bookNumber: seriesContext.bookNumber }),
    rootPath: normalizedRoot,
    elements,
    actLabels: projectMetadata.actLabels ?? {},
    actDescriptions: projectMetadata.actDescriptions ?? {},
    chapterLabels: projectMetadata.chapterLabels ?? {},
    chapterDescriptions: projectMetadata.chapterDescriptions ?? {},
  };
}

export function isGeneratedCanvasPath(rootPath: string, path: string): boolean {
  const relative = path.slice(rootPath.length).replace(/^\/+/, "");
  return relative.split("/")[0]?.toLowerCase() === "canvas";
}

function parseElement(rootPath: string, document: StoryLineSourceDocument): StoryLineElement | null {
  const relativePath = document.path.startsWith(`${rootPath}/`)
    ? document.path.slice(rootPath.length).replace(/^\/+/, "")
    : document.path;
  const frontmatter = readFrontmatter(document.content);
  const category = categoryFromType(frontmatter.type) ?? categoryFromPath(relativePath);
  if (!category) return null;
  const pathSegments = relativePath.split("/");
  const basename = pathSegments[pathSegments.length - 1]?.replace(/\.md$/i, "") ?? relativePath;
  const title = frontmatter.title
    ?? frontmatter.name
    ?? (category === "sceneNotes" ? basename : firstHeading(document.content))
    ?? basename;
  const chapter = frontmatter.chapter ?? chapterFromPath(relativePath);
  return {
    id: stableId("storyline-element", document.path),
    category,
    title,
    ...optionalString("description", descriptionFor(category, frontmatter, document.content)),
    sourcePath: document.path,
    chapter,
    ...optionalNumber("act", frontmatter.act),
    ...optionalNumber("sequence", frontmatter.sequence),
    ...optionalString("notesFile", frontmatter.notesFile),
    ...optionalList("characters", uniqueStrings([
      ...(frontmatter.characters ?? []),
      ...(frontmatter.pov ? [frontmatter.pov] : []),
    ])),
    ...optionalList("locations", [
      ...(frontmatter.locations ?? []),
      ...(frontmatter.location ? [frontmatter.location] : []),
    ]),
    ...optionalString("status", frontmatter.status),
  };
}

function findProjectMetadata(documents: readonly StoryLineSourceDocument[]): StoryLineFrontmatter {
  for (const document of documents) {
    if (!document.path.toLowerCase().endsWith(".md")) continue;
    const frontmatter = readFrontmatter(document.content);
    if (frontmatter.type?.toLowerCase() === "storyline") return frontmatter;
  }
  return {};
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
  language?: string;
  title?: string;
  name?: string;
  chapter?: string;
  act?: string;
  sequence?: string;
  notesFile?: string;
  characters?: string[];
  pov?: string;
  location?: string;
  locations?: string[];
  status?: string;
  description?: string;
  subtitle?: string;
  role?: string;
  appearance?: string;
  seriesId?: string;
  actLabels?: Record<string, string>;
  actDescriptions?: Record<string, string>;
  chapterLabels?: Record<string, string>;
  chapterDescriptions?: Record<string, string>;
}

function readFrontmatter(content: string): StoryLineFrontmatter {
  const block = /^---\s*\n([\s\S]*?)\n---(?:\s*\n|$)/.exec(content)?.[1];
  if (!block) return {};
  const scalars: Record<string, string> = {};
  const lists: Record<string, string[]> = {};
  const maps: Record<string, Record<string, string>> = {};
  let activeList: string | null = null;
  let activeMap: string | null = null;
  for (const line of block.split("\n")) {
    const listItem = /^\s+-\s+(.+?)\s*$/.exec(line)?.[1];
    if (listItem && activeList) {
      (lists[activeList] ??= []).push(cleanYamlScalar(listItem));
      continue;
    }
    const mapItem = /^\s+["']?([^"':]+)["']?:\s*(.+?)\s*$/.exec(line);
    if (mapItem && activeMap) {
      const mapKey = mapItem[1]?.trim();
      const mapValue = mapItem[2];
      if (mapKey && mapValue) (maps[activeMap] ??= {})[mapKey] = cleanYamlScalar(mapValue);
      continue;
    }
    const match = /^([A-Za-zÄÖÜäöü_-]+):\s*(.*?)\s*$/.exec(line);
    if (!match) {
      activeList = null;
      activeMap = null;
      continue;
    }
    const key = match[1]?.toLowerCase();
    const value = match[2];
    if (!key) continue;
    if (!value) {
      activeList = key;
      activeMap = key;
      lists[key] ??= [];
      maps[key] ??= {};
      continue;
    }
    activeList = null;
    activeMap = null;
    scalars[key] = cleanYamlScalar(value);
  }
  return {
    ...optionalString("type", scalars.type ?? scalars.typ),
    ...optionalString("language", scalars.language ?? scalars.sprache),
    ...optionalString("title", scalars.title ?? scalars.titel),
    ...optionalString("name", scalars.name),
    ...optionalString("chapter", scalars.chapter ?? scalars.kapitel),
    ...optionalString("act", scalars.act),
    ...optionalString("sequence", scalars.sequence),
    ...optionalString("notesFile", normalizeLinkTarget(scalars.notesfile)),
    ...optionalList("characters", normalizeLinkTargets(lists.characters)),
    ...optionalString("pov", normalizeLinkTarget(scalars.pov)),
    ...optionalString("location", normalizeLinkTarget(scalars.location)),
    ...optionalList("locations", normalizeLinkTargets(lists.locations)),
    ...optionalString("status", scalars.status),
    ...optionalString("description", scalars.description ?? scalars.beschreibung),
    ...optionalString("subtitle", scalars.subtitle ?? scalars.untertitel),
    ...optionalString("role", scalars.role ?? scalars.rolle),
    ...optionalString("appearance", scalars.appearance ?? scalars.aussehen),
    ...optionalString("seriesId", scalars.seriesid),
    ...optionalMap("actLabels", maps.actlabels),
    ...optionalMap("actDescriptions", maps.actdescriptions),
    ...optionalMap("chapterLabels", maps.chapterlabels),
    ...optionalMap("chapterDescriptions", maps.chapterdescriptions),
  };
}

function descriptionFor(
  category: StoryLineCategory,
  frontmatter: StoryLineFrontmatter,
  content: string,
): string | undefined {
  if (frontmatter.description) return frontmatter.description;
  if (category === "scenes") return frontmatter.subtitle;
  if (category === "characters") return frontmatter.appearance ?? frontmatter.role;
  if (category === "sceneNotes") return firstBodyParagraph(content);
  return undefined;
}

function firstBodyParagraph(content: string): string | undefined {
  const body = content.replace(/^---\s*\n[\s\S]*?\n---(?:\s*\n|$)/, "");
  const paragraph = body
    .split(/\n\s*\n/)
    .map((part) => part.replace(/^#{1,6}\s+.*$/gm, "").trim())
    .find(Boolean);
  return paragraph?.replace(/\s+/g, " ");
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

function uniqueStrings(values: string[]): string[] | undefined {
  const unique = [...new Set(values)];
  return unique.length > 0 ? unique : undefined;
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

function optionalMap<Key extends string>(
  key: Key,
  value: Record<string, string> | undefined,
): Partial<Record<Key, Record<string, string>>> {
  return value && Object.keys(value).length > 0
    ? { [key]: value } as Record<Key, Record<string, string>>
    : {};
}

function firstHeading(content: string): string | null {
  return /^#\s+(.+)$/m.exec(content)?.[1]?.trim() ?? null;
}

function chapterFromPath(relativePath: string): string | null {
  const segments = relativePath.split("/");
  if (segments.length < 3) return null;
  return segments[1] ?? null;
}
