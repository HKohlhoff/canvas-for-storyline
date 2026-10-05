import assert from "node:assert/strict";
import test from "node:test";
import { createGenerationPlan, safeFileName } from "../src/generation/plan/create";
import type { StoryLineProject } from "../src/model/storyline";

const project: StoryLineProject = {
  name: "Projekt M",
  rootPath: "Romane/Projekt M",
  elements: [
    { id: "s1", category: "scenes", title: "Ankunft", sourcePath: "Romane/Projekt M/Szenen/Ankunft.md", chapter: "Kapitel 1" },
    { id: "n1", category: "sceneNotes", title: "Hinweis", sourcePath: "Romane/Projekt M/Szenen-Notizen/Hinweis.md", chapter: null },
    { id: "c1", category: "characters", title: "Mara", sourcePath: "Romane/Projekt M/Figuren/Mara.md", chapter: null },
    { id: "l1", category: "locations", title: "Akademie", sourcePath: "Romane/Projekt M/Orte/Akademie.md", chapter: null },
  ],
};

test("plans overview, chapter canvas, and master in the direct Canvas folder", () => {
  const plan = createGenerationPlan(project, {
    scenes: true, sceneNotes: true, characters: true, locations: true,
  });
  assert.equal(plan.outputPath, "Romane/Projekt M/Canvas");
  assert.deepEqual(plan.artifacts.map((artifact) => artifact.path), [
    "Romane/Projekt M/Canvas/Übersicht.canvas",
    "Romane/Projekt M/Canvas/Kapitel 1.canvas",
    "Romane/Projekt M/Canvas/Master.md",
  ]);
  const overview = JSON.parse(plan.artifacts[0]?.content ?? "{}") as {
    nodes: Array<{ id: string; type: string }>;
    edges: Array<{ id: string; fromNode: string; toNode: string }>;
  };
  assert.equal(overview.nodes.length, 5);
  assert.equal(new Set(overview.nodes.map((node) => node.id)).size, overview.nodes.length);
  assert.equal(new Set(overview.edges.map((edge) => edge.id)).size, overview.edges.length);
  const nodeIds = new Set(overview.nodes.map((node) => node.id));
  assert.equal(overview.edges.every((edge) => nodeIds.has(edge.fromNode) && nodeIds.has(edge.toNode)), true);
  assert.match(plan.artifacts[plan.artifacts.length - 1]?.content ?? "", /!\[\[Romane\/Projekt M\/Figuren\/Mara\.md\]\]/);
});

test("category selection is applied to both Canvas and master output", () => {
  const plan = createGenerationPlan(project, {
    scenes: true, sceneNotes: false, characters: false, locations: false,
  });
  const master = plan.artifacts.find((artifact) => artifact.path.endsWith("Master.md"))?.content ?? "";
  assert.match(master, /Ankunft/);
  assert.doesNotMatch(master, /Mara|Akademie|Hinweis/);
});

test("chapter names are made safe for Vault file names", () => {
  assert.equal(safeFileName("Teil 1: Anfang/Ende"), "Teil 1- Anfang-Ende");
});

test("does not plan colliding Canvas paths for reserved or sanitized chapter names", () => {
  const collidingProject: StoryLineProject = {
    name: "Roman",
    rootPath: "Roman",
    elements: [
      { id: "s1", category: "scenes", title: "Eins", sourcePath: "Roman/Scenes/1.md", chapter: "Übersicht" },
      { id: "s2", category: "scenes", title: "Zwei", sourcePath: "Roman/Scenes/2.md", chapter: "Teil:A" },
      { id: "s3", category: "scenes", title: "Drei", sourcePath: "Roman/Scenes/3.md", chapter: "Teil/A" },
    ],
  };

  const paths = createGenerationPlan(collidingProject, {
    scenes: true, sceneNotes: true, characters: true, locations: true,
  }).artifacts.map((artifact) => artifact.path.toLocaleLowerCase("de"));
  assert.equal(new Set(paths).size, paths.length);
});

test("orders numeric chapters and master scenes by StoryLine narrative metadata", () => {
  const parsed = {
    name: "Roman",
    rootPath: "Roman",
    elements: [
      {
        id: "late",
        category: "scenes" as const,
        title: "Spaeter",
        sourcePath: "Roman/Scenes/Act 1/00-01 Spaeter.md",
        chapter: "10",
        act: 1,
        sequence: 2,
      },
      {
        id: "early",
        category: "scenes" as const,
        title: "Frueher",
        sourcePath: "Roman/Scenes/Act 3/99-99 Frueher.md",
        chapter: "2",
        act: 1,
        sequence: 1,
      },
    ],
  };

  const plan = createGenerationPlan(parsed, {
    scenes: true, sceneNotes: true, characters: true, locations: true,
  });
  assert.deepEqual(
    plan.artifacts.filter((artifact) => artifact.path.endsWith(".canvas")).map((artifact) => artifact.path),
    ["Roman/Canvas/Übersicht.canvas", "Roman/Canvas/2.canvas", "Roman/Canvas/10.canvas"],
  );
  const master = plan.artifacts.find((artifact) => artifact.path.endsWith("Master.md"))?.content ?? "";
  assert.ok(master.indexOf("Frueher") < master.indexOf("Spaeter"));
});
