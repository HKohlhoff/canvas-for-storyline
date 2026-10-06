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
  const acts = uniqueActs(chapters);
  const columnHeight = Math.max(
    340,
    ...acts.map((act) => {
      const chapterCount = chapters.filter((chapter) => chapter.act === act).length;
      return chapterCount === 0 ? 0 : 340 + (chapterCount - 1) * 320;
    }),
  );
  const nodes: CanvasNode[] = [{
    id: stableId("overview-header", project.rootPath),
    type: "text",
    x: 0,
    y: 0,
    width: Math.max(2000, Math.max(1, acts.length) * 680 - 40),
    height: 200,
    text: overviewInfoText(project.name, project.bookNumber),
  }];

  for (const [actIndex, act] of acts.entries()) {
    const actChapters = chapters.filter((chapter) => chapter.act === act);
    const x = actIndex * 680;
    nodes.push({
      id: stableId("overview-act", project.rootPath, String(act ?? "none")),
      type: "group",
      label: act === null
        ? "Kapitel"
        : `Akt ${act}${project.actLabels[String(act)] ? ` · ${project.actLabels[String(act)]}` : ""}`,
      color: "4",
      x,
      y: 380,
      width: 640,
      height: columnHeight,
    });
    for (const [chapterIndex, chapter] of actChapters.entries()) {
      const xPosition = x + 80;
      const yPosition = 460 + chapterIndex * 320;
      const cardColor = "4";
      nodes.push({
        id: chapterNodeId(project, chapter),
        type: "file",
        label: `Kapitel ${chapter.number} · ${chapter.label}`,
        file: chapter.path,
        color: cardColor,
        ...(chapter.description ? { cfsDescription: normalizedDescription(chapter.description) } : {}),
        x: xPosition,
        y: yPosition,
        width: 480,
        height: 220,
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
  return serializeCanvas(nodes, edges);
}

export function renderChapterCanvas(
  project: StoryLineProject,
  chapter: ChapterCanvasDescriptor,
  scenes: readonly StoryLineElement[],
  availableElements: readonly StoryLineElement[],
  includedCategories: Readonly<Record<StoryLineCategory, boolean>>,
  overviewPath: string,
): string {
  const relationships = scenes.flatMap((scene) => resolveRelationships(scene, availableElements));
  const relatedByCategory = {
    sceneNotes: uniqueTargets(relationships, "sceneNotes"),
    characters: uniqueTargets(relationships, "characters"),
    locations: uniqueTargets(relationships, "locations"),
  };
  const innerHeight = Math.max(
    300,
    columnContentHeight(includedCategories.scenes, scenes.length, 420, 340),
    columnContentHeight(
      includedCategories.sceneNotes,
      relatedByCategory.sceneNotes.length,
      420,
      340,
    ),
    columnContentHeight(
      includedCategories.characters,
      relatedByCategory.characters.length,
      470,
      280,
    ),
    columnContentHeight(
      includedCategories.locations,
      relatedByCategory.locations.length,
      510,
      320,
    ),
  );
  const nodes: CanvasNode[] = [
    {
      id: stableId("chapter-nav", project.rootPath, chapter.number),
      type: "file",
      label: "← Übersicht",
      file: overviewPath,
      color: "5",
      x: 0,
      y: -120,
      width: 440,
      height: 120,
    },
    {
      id: stableId("chapter-color-info", project.rootPath, chapter.number),
      type: "text",
      text: colorInfoText(),
      x: 520,
      y: -120,
      width: 2520,
      height: 120,
    },
    {
      id: stableId("chapter-group", project.rootPath, chapter.number),
      type: "group",
      label: `Kapitel ${chapter.number} · ${chapter.label}`,
      color: "4",
      x: 0,
      y: 180,
      width: 3040,
      height: innerHeight + 160,
    },
  ];

  addCategoryGroup(nodes, project, chapter, "scenes", includedCategories.scenes, 100, 620, innerHeight, "Szenen");
  addCategoryGroup(nodes, project, chapter, "sceneNotes", includedCategories.sceneNotes, 840, 620, innerHeight, "Szenen-Notizen");
  addCategoryGroup(nodes, project, chapter, "characters", includedCategories.characters, 1580, 620, innerHeight, "Figuren und POV");
  addCategoryGroup(nodes, project, chapter, "locations", includedCategories.locations, 2320, 620, innerHeight, "Orte");

  if (includedCategories.scenes) {
    scenes.forEach((scene, index) => addElementCard(nodes, project, chapter, scene, 220, 340 + index * 340, 380, 240));
  }
  if (includedCategories.sceneNotes) {
    relatedByCategory.sceneNotes.forEach((note) => {
      const relationshipIndex = scenes.findIndex((scene) => relationships.some(
        (relationship) => relationship.source.id === scene.id && relationship.target.id === note.id,
      ));
      addElementCard(nodes, project, chapter, note, 920, 340 + Math.max(0, relationshipIndex) * 340, 460, 240);
    });
  }
  if (includedCategories.characters) {
    relatedByCategory.characters.forEach((character, index) => {
      addElementCard(nodes, project, chapter, character, 1725, 450 + index * 280, 330, 180);
    });
  }
  if (includedCategories.locations) {
    relatedByCategory.locations.forEach((location, index) => {
      addElementCard(nodes, project, chapter, location, 2465, 450 + index * 320, 330, 220);
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
  return serializeCanvas(nodes, edges);
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
    y: 260,
    width,
    height,
  });
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

function overviewInfoText(projectName: string, bookNumber: number | undefined): string {
  return [
    `# ${[
      ...(bookNumber === undefined ? [] : [`Buch ${bookNumber}`]),
      projectName,
      "Übersicht",
    ].join(" - ")}`,
    "",
    colorInfoText(),
  ].join("\n");
}

function colorInfoText(): string {
  const legend = Object.entries(STORYLINE_STATUS_COLORS)
    .map(([status, entry]) => `[${entry.name}](cfs-color://${status}) – ${entry.meaning}`)
    .join(" - ");
  return [
    "> [!info] Farbcode aus StoryLine",
    `> ${legend}`,
  ].join("\n");
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

function serializeCanvas(nodes: readonly CanvasNode[], edges: readonly CanvasEdge[]): string {
  return `${JSON.stringify({ nodes, edges }, null, 2)}\n`;
}
