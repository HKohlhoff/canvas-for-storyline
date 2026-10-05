import { stableId } from "../identity";
import type { StoryLineElement } from "../../model/storyline";

interface CanvasNode {
  id: string;
  type: "file" | "text";
  x: number;
  y: number;
  width: number;
  height: number;
  file?: string;
  text?: string;
}

interface CanvasEdge {
  id: string;
  fromNode: string;
  toNode: string;
  fromSide: "right";
  toSide: "left";
}

export function renderElementCanvas(title: string, elements: readonly StoryLineElement[]): string {
  return renderCanvas(title, elements, []);
}

export function renderChapterCanvas(
  title: string,
  scenes: readonly StoryLineElement[],
  availableElements: readonly StoryLineElement[],
): string {
  const relationships = scenes.flatMap((scene) => resolveRelationships(scene, availableElements));
  const relatedElements = relationships.map((relationship) => relationship.target);
  const elements = [...new Map([...scenes, ...relatedElements].map((element) => [element.id, element])).values()];
  return renderCanvas(title, elements, relationships);
}

interface CanvasRelationship {
  source: StoryLineElement;
  target: StoryLineElement;
}

function renderCanvas(
  title: string,
  elements: readonly StoryLineElement[],
  relationships: readonly CanvasRelationship[],
): string {
  const titleId = stableId("canvas-title", title);
  const titleNode: CanvasNode = {
    id: titleId,
    type: "text",
    x: 0,
    y: 0,
    width: 320,
    height: 120,
    text: `# ${title}`,
  };
  const nodes = elements.map((element, index): CanvasNode => ({
    id: stableId("canvas-node", title, element.id),
    type: "file",
    x: 480 + Math.floor(index / 6) * 440,
    y: (index % 6) * 220 - 440,
    width: 360,
    height: 180,
    file: element.sourcePath,
  }));
  const titleEdges = nodes.map((node): CanvasEdge => ({
    id: stableId("canvas-edge", titleId, node.id),
    fromNode: titleId,
    toNode: node.id,
    fromSide: "right",
    toSide: "left",
  }));
  const nodeIds = new Map(elements.map((element) => [element.id, stableId("canvas-node", title, element.id)]));
  const relationshipEdges = relationships.flatMap((relationship): CanvasEdge[] => {
    const fromNode = nodeIds.get(relationship.source.id);
    const toNode = nodeIds.get(relationship.target.id);
    if (!fromNode || !toNode) return [];
    return [{
      id: stableId("canvas-relationship", title, relationship.source.id, relationship.target.id),
      fromNode,
      toNode,
      fromSide: "right",
      toSide: "left",
    }];
  });
  return `${JSON.stringify({ nodes: [titleNode, ...nodes], edges: [...titleEdges, ...relationshipEdges] }, null, 2)}\n`;
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
  category: StoryLineElement["category"],
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
