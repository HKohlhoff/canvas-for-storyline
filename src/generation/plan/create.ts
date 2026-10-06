import type { StoryLineCategory, StoryLineElement, StoryLineProject } from "../../model/storyline";
import { normalizeVaultPath } from "../../vault/path";
import {
  renderChapterCanvas,
  renderOverviewCanvas,
  type ChapterCanvasDescriptor,
} from "../canvas/render";
import { stableId } from "../identity";
import { renderMaster } from "../master/render";
import type { GenerationPlan } from "./types";

export function createGenerationPlan(
  project: StoryLineProject,
  includedCategories: Readonly<Record<StoryLineCategory, boolean>>,
  includeMaster = true,
  masterOutputPath = "",
): GenerationPlan {
  const canvasPlan = createCanvasGenerationPlan(project, includedCategories);
  if (!includeMaster) return canvasPlan;
  const masterPlan = createMasterGenerationPlan(project, masterOutputPath);
  return { ...canvasPlan, artifacts: [...canvasPlan.artifacts, ...masterPlan.artifacts] };
}

export function createCanvasGenerationPlan(
  project: StoryLineProject,
  includedCategories: Readonly<Record<StoryLineCategory, boolean>>,
): GenerationPlan {
  const outputPath = normalizeVaultPath(`${project.rootPath}/Canvas`);
  const selected = project.elements
    .filter((element) => includedCategories[element.category])
    .slice()
    .sort(compareStoryLineElements);
  const documentName = project.name;
  const overviewPath = normalizeVaultPath(`${outputPath}/${safeFileName(`${documentName} - Übersicht`)}.canvas`);
  const usedPaths = new Set([overviewPath].map((path) => path.toLocaleLowerCase("de")));
  const chapterNumbers = [...new Set(
    selected
      .filter((element) => element.category === "scenes" && element.chapter)
      .map((element) => element.chapter as string),
  )].sort(naturalCompare);
  const chapters: ChapterCanvasDescriptor[] = chapterNumbers.map((number) => {
    const scenes = selected.filter((element) => element.category === "scenes" && element.chapter === number);
    const label = project.chapterLabels[number] ?? number;
    const fileName = safeFileName(`${documentName} - Kapitel ${number} - ${label}`);
    return {
      number,
      label,
      ...(project.chapterDescriptions[number] ? { description: project.chapterDescriptions[number] } : {}),
      act: scenes.find((scene) => scene.act !== undefined)?.act ?? null,
      path: reserveChapterPath(outputPath, fileName, usedPaths),
    };
  });
  const artifacts = [{
    path: overviewPath,
    content: renderOverviewCanvas(project, chapters),
  }];
  for (const chapter of chapters) {
    const scenes = selected.filter((element) => element.category === "scenes" && element.chapter === chapter.number);
    artifacts.push({
      path: chapter.path,
      content: renderChapterCanvas(project, chapter, scenes, selected, includedCategories, overviewPath),
    });
  }
  return { projectPath: project.rootPath, outputPath, artifacts };
}

export function createMasterGenerationPlan(project: StoryLineProject, configuredOutputPath = ""): GenerationPlan {
  const outputPath = configuredOutputPath
    ? normalizeVaultPath(configuredOutputPath)
    : normalizeVaultPath(`${project.rootPath}/Canvas`);
  const scenes = project.elements
    .filter((element) => element.category === "scenes")
    .slice()
    .sort(compareStoryLineElements);
  return {
    projectPath: project.rootPath,
    outputPath,
    artifacts: [{
      path: normalizeVaultPath(`${outputPath}/Master.md`),
      content: renderMaster(project, scenes),
    }],
  };
}

function reserveChapterPath(outputPath: string, baseName: string, usedPaths: Set<string>): string {
  let suffix = "";
  let attempt = 0;
  while (true) {
    const path = normalizeVaultPath(`${outputPath}/${baseName}${suffix}.canvas`);
    const collisionKey = path.toLocaleLowerCase("de");
    if (!usedPaths.has(collisionKey)) {
      usedPaths.add(collisionKey);
      return path;
    }
    attempt += 1;
    const identity = stableId("chapter-output", baseName, String(attempt)).slice(0, 8);
    suffix = `--${identity}`;
  }
}

export function safeFileName(value: string): string {
  const cleaned = value
    .replace(/\?/g, "")
    .replace(/[\\/:*"<>|#^[\]]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || "Ohne Kapitel";
}

const CATEGORY_ORDER: Record<StoryLineCategory, number> = {
  scenes: 0,
  sceneNotes: 1,
  characters: 2,
  locations: 3,
};

const NATURAL_COLLATOR = new Intl.Collator("de", { numeric: true, sensitivity: "base" });

export function compareStoryLineElements(left: StoryLineElement, right: StoryLineElement): number {
  const categoryOrder = CATEGORY_ORDER[left.category] - CATEGORY_ORDER[right.category];
  if (categoryOrder !== 0) return categoryOrder;
  if (left.category === "scenes" && right.category === "scenes") {
    const actOrder = compareOptionalNumbers(left.act, right.act);
    if (actOrder !== 0) return actOrder;
    const chapterOrder = naturalCompare(left.chapter ?? "", right.chapter ?? "");
    if (chapterOrder !== 0) return chapterOrder;
    const sequenceOrder = compareOptionalNumbers(left.sequence, right.sequence);
    if (sequenceOrder !== 0) return sequenceOrder;
  }
  const titleOrder = naturalCompare(left.title, right.title);
  return titleOrder !== 0 ? titleOrder : naturalCompare(left.sourcePath, right.sourcePath);
}

function naturalCompare(left: string, right: string): number {
  return NATURAL_COLLATOR.compare(left, right);
}

function compareOptionalNumbers(left: number | undefined, right: number | undefined): number {
  if (left === right) return 0;
  if (left === undefined) return 1;
  if (right === undefined) return -1;
  return left - right;
}
