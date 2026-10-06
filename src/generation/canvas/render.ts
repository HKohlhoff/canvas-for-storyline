import type {
  StoryLineCategory,
  StoryLineElement,
  StoryLineProject,
} from "../../model/storyline";
import { stableId } from "../identity";

type CanvasColor = string;

interface CanvasNodeBase {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: CanvasColor;
}

interface CanvasFileNode extends CanvasNodeBase {
  type: "file";
  file: string;
  label?: string;
  cfsDescription?: string;
}

interface CanvasTextNode extends CanvasNodeBase {
  type: "text";
  text: string;
}

interface CanvasGroupNode extends CanvasNodeBase {
  type: "group";
  label: string;
}

type CanvasNode = CanvasFileNode | CanvasTextNode | CanvasGroupNode;

interface CanvasEdge {
  id: string;
  fromNode: string;
  toNode: string;
  fromSide: "right" | "bottom";
  toSide: "left" | "top";
  color?: CanvasColor;
}

export interface ChapterCanvasDescriptor {
  number: string;
  label: string;
  description?: string;
  act: number | null;
  path: string;
}

interface CanvasRelationship {
  source: StoryLineElement;
  target: StoryLineElement;
}

const CATEGORY_COLORS: Record<StoryLineCategory, CanvasColor> = {
  scenes: "4",
  sceneNotes: "2",
  characters: "6",
  locations: "5",
};

const CHAPTER_CARD_WIDTH = 460;
const CHAPTER_CARD_HEIGHT = 240;
const CHAPTER_COLUMN_PADDING = 40;
const CHAPTER_CATEGORY_TOP = 370;
const CHAPTER_CARD_TOP = CHAPTER_CATEGORY_TOP + CHAPTER_COLUMN_PADDING;
const CHAPTER_CARD_VERTICAL_GAP = CHAPTER_COLUMN_PADDING;
const OVERVIEW_COLUMN_WIDTH = 560;
const OVERVIEW_COLUMN_GAP = 40;
const OVERVIEW_CARD_HEIGHT = 220;
const OVERVIEW_COLUMN_PADDING = 70;
const OVERVIEW_CARD_VERTICAL_GAP = OVERVIEW_COLUMN_PADDING;
const OVERVIEW_GROUP_TOP = 290;
const OVERVIEW_CARD_TOP = OVERVIEW_GROUP_TOP + OVERVIEW_COLUMN_PADDING;
const OVERVIEW_SINGLE_CARD_CONTENT_HEIGHT = OVERVIEW_COLUMN_PADDING
  + OVERVIEW_CARD_HEIGHT
  + OVERVIEW_COLUMN_PADDING;
const CHAPTER_COLUMN_WIDTH = 540;
const CHAPTER_COLUMN_GAP = 80;
const CHAPTER_HORIZONTAL_MARGIN = 80;
const CHAPTER_CANVAS_WIDTH = CHAPTER_HORIZONTAL_MARGIN * 2
  + CHAPTER_COLUMN_WIDTH * 4
  + CHAPTER_COLUMN_GAP * 3;
const CHAPTER_SINGLE_CARD_CONTENT_HEIGHT = CHAPTER_COLUMN_PADDING
  + CHAPTER_CARD_HEIGHT
  + CHAPTER_COLUMN_PADDING;

const STORYLINE_STATUS_COLORS: Readonly<Record<string, {
  canvasColor: CanvasColor;
  name: string;
  meaning: string;
}>> = {
  idea: { canvasColor: "#9E9E9E", name: "Grau", meaning: "Idea (Idee)" },
  outlined: { canvasColor: "#2196F3", name: "Blau", meaning: "Outlined (gegliedert)" },
  draft: { canvasColor: "#FF9800", name: "Orange", meaning: "Draft (Entwurf)" },
  written: { canvasColor: "#4CAF50", name: "Grün", meaning: "Written (geschrieben)" },
  revised: { canvasColor: "#9C27B0", name: "Violett", meaning: "Revised (überarbeitet)" },
  final: { canvasColor: "#F44336", name: "Rot", meaning: "Final (fertig)" },
};

export function renderOverviewCanvas(
  project: StoryLineProject,
  chapters: readonly ChapterCanvasDescriptor[],
): string {
  const labels = canvasLabels(project);
  const acts = uniqueActs(chapters);
  const columnHeight = Math.max(
    OVERVIEW_SINGLE_CARD_CONTENT_HEIGHT,
    ...acts.map((act) => {
      const chapterCount = chapters.filter((chapter) => chapter.act === act).length;
      return chapterCount === 0
        ? 0
        : OVERVIEW_SINGLE_CARD_CONTENT_HEIGHT
          + (chapterCount - 1) * (OVERVIEW_CARD_HEIGHT + OVERVIEW_CARD_VERTICAL_GAP);
    }),
  );
  const nodes: CanvasNode[] = [{
    id: stableId("overview-header", project.rootPath),
    type: "text",
    x: 0,
    y: 0,
    width: Math.max(1, acts.length) * (OVERVIEW_COLUMN_WIDTH + OVERVIEW_COLUMN_GAP)
      - OVERVIEW_COLUMN_GAP,
    height: 200,
    text: overviewInfoText(project, labels),
  }];

  for (const [actIndex, act] of acts.entries()) {
    const actChapters = chapters.filter((chapter) => chapter.act === act);
    const x = actIndex * (OVERVIEW_COLUMN_WIDTH + OVERVIEW_COLUMN_GAP);
    nodes.push({
      id: stableId("overview-act", project.rootPath, String(act ?? "none")),
      type: "group",
      label: act === null
        ? labels.chapter
        : `${labels.act} ${act}${project.actLabels[String(act)] ? ` · ${project.actLabels[String(act)]}` : ""}`,
      color: "4",
      x,
      y: OVERVIEW_GROUP_TOP,
      width: OVERVIEW_COLUMN_WIDTH,
      height: columnHeight,
    });
    for (const [chapterIndex, chapter] of actChapters.entries()) {
      const xPosition = x + (OVERVIEW_COLUMN_WIDTH - 480) / 2;
      const yPosition = OVERVIEW_CARD_TOP
        + chapterIndex * (OVERVIEW_CARD_HEIGHT + OVERVIEW_CARD_VERTICAL_GAP);
      const cardColor = "4";
      nodes.push({
        id: chapterNodeId(project, chapter),
        type: "file",
        label: `${labels.chapter} ${chapter.number} · ${chapter.label}`,
        file: chapter.path,
        color: cardColor,
        ...(chapter.description ? { cfsDescription: normalizedDescription(chapter.description) } : {}),
        x: xPosition,
        y: yPosition,
        width: 480,
        height: OVERVIEW_CARD_HEIGHT,
      });
    }
  }

  const edges: CanvasEdge[] = chapters.slice(0, -1).map((chapter, index) => {
    const next = chapters[index + 1] as ChapterCanvasDescriptor;
    const sameAct = chapter.act === next.act;
    return {
      id: stableId("overview-sequence", project.rootPath, chapter.number, next.number),
      fromNode: chapterNodeId(project, chapter),
      toNode: chapterNodeId(project, next),
      fromSide: sameAct ? "bottom" : "right",
      toSide: sameAct ? "top" : "left",
    };
  });
  return serializeCanvas(nodes, edges, labels.overview);
}

export function renderChapterCanvas(
  project: StoryLineProject,
  chapter: ChapterCanvasDescriptor,
  scenes: readonly StoryLineElement[],
  availableElements: readonly StoryLineElement[],
  includedCategories: Readonly<Record<StoryLineCategory, boolean>>,
  overviewPath: string,
): string {
  const labels = canvasLabels(project);
  const relationships = scenes.flatMap((scene) => resolveRelationships(scene, availableElements));
  const relatedByCategory = {
    sceneNotes: uniqueTargets(relationships, "sceneNotes"),
    characters: uniqueTargets(relationships, "characters"),
    locations: uniqueTargets(relationships, "locations"),
  };
  const innerHeight = Math.max(
    300,
    columnContentHeight(
      includedCategories.scenes,
      scenes.length,
      CHAPTER_SINGLE_CARD_CONTENT_HEIGHT,
      CHAPTER_CARD_HEIGHT + CHAPTER_CARD_VERTICAL_GAP,
    ),
    columnContentHeight(
      includedCategories.sceneNotes,
      relatedByCategory.sceneNotes.length,
      CHAPTER_SINGLE_CARD_CONTENT_HEIGHT,
      CHAPTER_CARD_HEIGHT + CHAPTER_CARD_VERTICAL_GAP,
    ),
    columnContentHeight(
      includedCategories.characters,
      relatedByCategory.characters.length,
      CHAPTER_SINGLE_CARD_CONTENT_HEIGHT,
      CHAPTER_CARD_HEIGHT + CHAPTER_CARD_VERTICAL_GAP,
    ),
    columnContentHeight(
      includedCategories.locations,
      relatedByCategory.locations.length,
      CHAPTER_SINGLE_CARD_CONTENT_HEIGHT,
      CHAPTER_CARD_HEIGHT + CHAPTER_CARD_VERTICAL_GAP,
    ),
  );
  const nodes: CanvasNode[] = [
    {
      id: stableId("chapter-color-info", project.rootPath, chapter.number),
      type: "text",
      text: chapterInfoText(project, chapter, overviewPath),
      x: 0,
      y: 0,
      width: CHAPTER_CANVAS_WIDTH,
      height: 200,
    },
    {
      id: stableId("chapter-group", project.rootPath, chapter.number),
      type: "group",
      label: `${labels.chapter} ${chapter.number} · ${chapter.label}`,
      color: "4",
      x: 0,
      y: 290,
      width: CHAPTER_CANVAS_WIDTH,
      height: innerHeight + 160,
    },
  ];

  const columnXs = Array.from({ length: 4 }, (_, index) => (
    CHAPTER_HORIZONTAL_MARGIN + index * (CHAPTER_COLUMN_WIDTH + CHAPTER_COLUMN_GAP)
  ));
  addCategoryGroup(nodes, project, chapter, "scenes", includedCategories.scenes, columnXs[0] ?? 0, CHAPTER_COLUMN_WIDTH, innerHeight, labels.scenes);
  addCategoryGroup(nodes, project, chapter, "sceneNotes", includedCategories.sceneNotes, columnXs[1] ?? 0, CHAPTER_COLUMN_WIDTH, innerHeight, labels.sceneNotes);
  addCategoryGroup(nodes, project, chapter, "characters", includedCategories.characters, columnXs[2] ?? 0, CHAPTER_COLUMN_WIDTH, innerHeight, labels.charactersAndPov);
  addCategoryGroup(nodes, project, chapter, "locations", includedCategories.locations, columnXs[3] ?? 0, CHAPTER_COLUMN_WIDTH, innerHeight, labels.locations);

  if (includedCategories.scenes) {
    scenes.forEach((scene, index) => addElementCard(
      nodes,
      project,
      chapter,
      scene,
      centeredCardX(columnXs[0] ?? 0),
      CHAPTER_CARD_TOP + index * (CHAPTER_CARD_HEIGHT + CHAPTER_CARD_VERTICAL_GAP),
      CHAPTER_CARD_WIDTH,
      CHAPTER_CARD_HEIGHT,
    ));
  }
  if (includedCategories.sceneNotes) {
    relatedByCategory.sceneNotes.forEach((note) => {
      const relationshipIndex = scenes.findIndex((scene) => relationships.some(
        (relationship) => relationship.source.id === scene.id && relationship.target.id === note.id,
      ));
      addElementCard(
        nodes,
        project,
        chapter,
        note,
        centeredCardX(columnXs[1] ?? 0),
        CHAPTER_CARD_TOP
          + Math.max(0, relationshipIndex) * (CHAPTER_CARD_HEIGHT + CHAPTER_CARD_VERTICAL_GAP),
        CHAPTER_CARD_WIDTH,
        CHAPTER_CARD_HEIGHT,
      );
    });
  }
  if (includedCategories.characters) {
    relatedByCategory.characters.forEach((character, index) => {
      addElementCard(
        nodes,
        project,
        chapter,
        character,
        centeredCardX(columnXs[2] ?? 0),
        CHAPTER_CARD_TOP + index * (CHAPTER_CARD_HEIGHT + CHAPTER_CARD_VERTICAL_GAP),
        CHAPTER_CARD_WIDTH,
        CHAPTER_CARD_HEIGHT,
      );
    });
  }
  if (includedCategories.locations) {
    relatedByCategory.locations.forEach((location, index) => {
      addElementCard(
        nodes,
        project,
        chapter,
        location,
        centeredCardX(columnXs[3] ?? 0),
        CHAPTER_CARD_TOP + index * (CHAPTER_CARD_HEIGHT + CHAPTER_CARD_VERTICAL_GAP),
        CHAPTER_CARD_WIDTH,
        CHAPTER_CARD_HEIGHT,
      );
    });
  }

  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges = relationships.flatMap((relationship): CanvasEdge[] => {
    const fromNode = elementNodeId(project, chapter, relationship.source);
    const toNode = elementNodeId(project, chapter, relationship.target);
    if (!nodeIds.has(fromNode) || !nodeIds.has(toNode)) return [];
    return [{
      id: stableId("chapter-relation", project.rootPath, chapter.number, relationship.source.id, relationship.target.id),
      fromNode,
      toNode,
      fromSide: "right",
      toSide: "left",
      color: CATEGORY_COLORS[relationship.target.category],
    }];
  });
  return serializeCanvas(nodes, edges, `${labels.chapter} ${chapter.number} - ${chapter.label}`);
}

function addCategoryGroup(
  nodes: CanvasNode[],
  project: StoryLineProject,
  chapter: ChapterCanvasDescriptor,
  category: StoryLineCategory,
  enabled: boolean,
  x: number,
  width: number,
  height: number,
  label: string,
): void {
  if (!enabled) return;
  nodes.push({
    id: stableId("chapter-category", project.rootPath, chapter.number, category),
    type: "group",
    label,
    color: CATEGORY_COLORS[category],
    x,
    y: CHAPTER_CATEGORY_TOP,
    width,
    height,
  });
}

function centeredCardX(columnX: number): number {
  return columnX + (CHAPTER_COLUMN_WIDTH - CHAPTER_CARD_WIDTH) / 2;
}

function columnContentHeight(
  enabled: boolean,
  itemCount: number,
  firstItemHeight: number,
  itemStep: number,
): number {
  return enabled && itemCount > 0
    ? firstItemHeight + (itemCount - 1) * itemStep
    : 0;
}

function addElementCard(
  nodes: CanvasNode[],
  project: StoryLineProject,
  chapter: ChapterCanvasDescriptor,
  element: StoryLineElement,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const cardColor = element.category === "scenes"
    ? sceneColor(element.status)
    : CATEGORY_COLORS[element.category];
  nodes.push({
    id: elementNodeId(project, chapter, element),
    type: "file",
    file: element.sourcePath,
    color: cardColor,
    ...(element.description ? { cfsDescription: normalizedDescription(element.description) } : {}),
    x,
    y,
    width,
    height,
  });
}

function sceneColor(status: string | undefined): CanvasColor {
  return STORYLINE_STATUS_COLORS[status?.toLowerCase() ?? "idea"]?.canvasColor
    ?? STORYLINE_STATUS_COLORS.idea?.canvasColor
    ?? "#9E9E9E";
}

function normalizedDescription(description: string): string {
  return description.replace(/\r?\n/g, " ");
}

function overviewInfoText(project: StoryLineProject, labels: CanvasLabels): string {
  return [
    `# ${[
      ...(project.bookNumber === undefined ? [] : [`${labels.book} ${project.bookNumber}`]),
      project.name,
      labels.overview,
    ].join(" - ")}`,
    "",
    colorInfoText(project),
  ].join("\n");
}

function chapterInfoText(
  project: StoryLineProject,
  chapter: ChapterCanvasDescriptor,
  overviewPath: string,
): string {
  const labels = canvasLabels(project);
  return [
    `# ${[
      ...(project.bookNumber === undefined ? [] : [`${labels.book} ${project.bookNumber}`]),
      project.name,
      `${labels.chapter} ${chapter.number}`,
      chapter.label,
    ].join(" - ")} &emsp;<small>(back to: **[[${overviewPath}|Canvas]]**)</small>`,
    "",
    colorInfoText(project),
  ].join("\n");
}

function colorInfoText(project: StoryLineProject): string {
  const english = isEnglish(project);
  const legend = Object.entries(STORYLINE_STATUS_COLORS)
    .map(([status, entry]) => (
      `$\\textcolor{${entry.canvasColor}}{\\textsf{${mathText(english ? englishColorName(status) : entry.name)}}}$ – ${english ? englishStatusMeaning(status) : entry.meaning}`
    ))
    .join(" - ");
  return [
    english ? "> [!info] StoryLine color code" : "> [!info] Farbcode aus StoryLine",
    `> ${legend}`,
  ].join("\n");
}

interface CanvasLabels {
  overview: string;
  chapter: string;
  act: string;
  book: string;
  scenes: string;
  sceneNotes: string;
  charactersAndPov: string;
  locations: string;
}

function canvasLabels(project: StoryLineProject): CanvasLabels {
  return isEnglish(project)
    ? { overview: "Overview", chapter: "Chapter", act: "Act", book: "Book", scenes: "Scenes", sceneNotes: "Scene Notes", charactersAndPov: "Characters and POV", locations: "Locations" }
    : { overview: "Übersicht", chapter: "Kapitel", act: "Akt", book: "Buch", scenes: "Szenen", sceneNotes: "Szenen-Notizen", charactersAndPov: "Figuren und POV", locations: "Orte" };
}

function isEnglish(project: StoryLineProject): boolean {
  return project.language?.toLowerCase().startsWith("en") ?? false;
}

function englishColorName(status: string): string {
  return ({ idea: "Gray", outlined: "Blue", draft: "Orange", written: "Green", revised: "Purple", final: "Red" } as Record<string, string>)[status] ?? status;
}

function englishStatusMeaning(status: string): string {
  return ({ idea: "Idea", outlined: "Outlined", draft: "Draft", written: "Written", revised: "Revised", final: "Final" } as Record<string, string>)[status] ?? status;
}

function mathText(value: string): string {
  return [...value].map((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint > 0x7f ? `\\char"${codePoint.toString(16).toUpperCase()}{}` : character;
  }).join("");
}

function uniqueActs(chapters: readonly ChapterCanvasDescriptor[]): Array<number | null> {
  return [...new Set(chapters.map((chapter) => chapter.act))];
}

function chapterNodeId(project: StoryLineProject, chapter: ChapterCanvasDescriptor): string {
  return prefixedStableId("cfs-card", "overview-chapter", project.rootPath, chapter.number);
}

function elementNodeId(
  project: StoryLineProject,
  chapter: ChapterCanvasDescriptor,
  element: StoryLineElement,
): string {
  return prefixedStableId("cfs-card", "chapter-element", project.rootPath, chapter.number, element.id);
}

function prefixedStableId(prefix: string, ...parts: string[]): string {
  return `${prefix}-${stableId(...parts)}`;
}

function uniqueTargets(
  relationships: readonly CanvasRelationship[],
  category: StoryLineCategory,
): StoryLineElement[] {
  return [...new Map(
    relationships
      .filter((relationship) => relationship.target.category === category)
      .map((relationship) => [relationship.target.id, relationship.target]),
  ).values()];
}

function resolveRelationships(
  scene: StoryLineElement,
  availableElements: readonly StoryLineElement[],
): CanvasRelationship[] {
  const targets = [
    ...resolveTargets(scene.notesFile ? [scene.notesFile] : [], "sceneNotes", availableElements),
    ...resolveTargets(scene.characters ?? [], "characters", availableElements),
    ...resolveTargets(scene.locations ?? [], "locations", availableElements),
  ];
  return [...new Map(targets.map((target) => [target.id, { source: scene, target }])).values()];
}

function resolveTargets(
  targets: readonly string[],
  category: StoryLineCategory,
  availableElements: readonly StoryLineElement[],
): StoryLineElement[] {
  const candidates = availableElements.filter((element) => element.category === category);
  return targets.flatMap((target) => {
    const normalizedTarget = normalizeLinkPath(target);
    const exact = candidates.find((candidate) => normalizeLinkPath(candidate.sourcePath) === normalizedTarget);
    if (exact) return [exact];
    const targetBasename = normalizedTarget.split("/").pop();
    const basename = candidates.find((candidate) => normalizeLinkPath(candidate.sourcePath).split("/").pop() === targetBasename);
    return basename ? [basename] : [];
  });
}

function normalizeLinkPath(value: string): string {
  return value.replace(/\\/g, "/").replace(/\.md$/i, "").toLocaleLowerCase("de");
}

function serializeCanvas(
  nodes: readonly CanvasNode[],
  edges: readonly CanvasEdge[],
  name: string,
): string {
  return `${JSON.stringify({ nodes, edges, name }, null, 2)}\n`;
}
