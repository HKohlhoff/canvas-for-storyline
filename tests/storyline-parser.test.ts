import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { createGenerationPlan } from "../src/generation/plan/create";
import { parseStoryLineProject, type StoryLineSourceDocument } from "../src/storyline/parser";

const fixtureRoot = "tests/fixtures/storyline/Projekt-M";

test("parses realistic StoryLine categories and excludes Canvas output", () => {
  const documents = readMarkdownDocuments(fixtureRoot);
  const project = parseStoryLineProject(fixtureRoot, documents);
  assert.equal(project.name, "Projekt-M");
  assert.deepEqual(
    project.elements.map((element) => element.category).sort(),
    ["characters", "locations", "sceneNotes", "scenes", "scenes"],
  );
  assert.equal(project.elements.some((element) => element.title === "Muss ignoriert werden"), false);
  assert.equal(project.elements.find((element) => element.title === "Die Ankunft")?.chapter, "Kapitel 1");
});

test("frontmatter type can classify a note outside a category folder", () => {
  const project = parseStoryLineProject("Roman", [{
    path: "Roman/Material/Heldin.md",
    content: "---\ntype: character\ntitle: Ada\n---\n",
  }]);
  assert.equal(project.elements[0]?.category, "characters");
  assert.equal(project.elements[0]?.title, "Ada");
});

test("recognizes English StoryLine folders without frontmatter", () => {
  const project = parseStoryLineProject("Roman", [
    { path: "Roman/Scenes/Act 1/Scene.md", content: "# Scene" },
    { path: "Roman/SceneNotes/Scene - Notes.md", content: "# Notes" },
    { path: "Roman/Codex/Characters/Ada.md", content: "# Ada" },
    { path: "Roman/Codex/Locations/Lab.md", content: "# Lab" },
    { path: "Roman/CANVAS/Nested/Scenes/Ignored.md", content: "# Ignored" },
  ]);

  assert.deepEqual(project.elements.map((element) => element.category).sort(), [
    "characters", "locations", "sceneNotes", "scenes",
  ]);
  assert.equal(project.elements.some((element) => element.title === "Ignored"), false);
});

test("uses StoryLine name fields for codex entries", () => {
  const project = parseStoryLineProject("Roman", [
    {
      path: "Roman/Codex/Characters/character-01.md",
      content: "---\ntype: character\nname: Ada Lovelace\n---\n",
    },
    {
      path: "Roman/Codex/Locations/location-01.md",
      content: "---\ntype: location\nname: Maschinenraum\n---\n",
    },
  ]);

  assert.deepEqual(project.elements.map((element) => element.title), ["Ada Lovelace", "Maschinenraum"]);
});

test("preserves real StoryLine scene metadata and resolves its relationships", () => {
  const project = parseStoryLineProject("Roman", [
    {
      path: "Roman/Scenes/Act 2/02-03 Begegnung.md",
      content: [
        "---",
        "type: scene",
        "title: Begegnung",
        "act: 2",
        "chapter: 10",
        "sequence: 3",
        "characters:",
        '  - "[[Roman/Codex/Characters/Ada]]"',
        '  - "[[Berta]]"',
        'location: "[[Roman/Codex/Locations/Maschinenraum]]"',
        "notesFile: Roman/SceneNotes/Begegnung - Notes.md",
        "---",
      ].join("\n"),
    },
  ]);

  const scene = project.elements[0] as unknown as Record<string, unknown>;
  assert.equal(scene.act, 2);
  assert.equal(scene.chapter, "10");
  assert.equal(scene.sequence, 3);
  assert.equal(scene.notesFile, "Roman/SceneNotes/Begegnung - Notes.md");
  assert.deepEqual(scene.characters, ["Roman/Codex/Characters/Ada", "Berta"]);
  assert.deepEqual(scene.locations, ["Roman/Codex/Locations/Maschinenraum"]);
});

test("chapter Canvas contains selected StoryLine relations and connects them to the scene", () => {
  const project = parseStoryLineProject("Roman", [
    {
      path: "Roman/Scenes/Act 1/01-01 Begegnung.md",
      content: [
        "---",
        "type: scene",
        "title: Begegnung",
        "act: 1",
        "chapter: 1",
        "sequence: 1",
        "characters:",
        '  - "[[Roman/Codex/Characters/Ada]]"',
        '  - "[[Berta]]"',
        "location: Labor",
        "notesFile: Roman/SceneNotes/Begegnung - Notes.md",
        "---",
      ].join("\n"),
    },
    { path: "Roman/SceneNotes/Begegnung - Notes.md", content: "# Notiz" },
    { path: "Roman/Codex/Characters/Ada.md", content: "---\ntype: character\nname: Ada\n---\n" },
    { path: "Roman/Codex/Characters/Berta.md", content: "---\ntype: character\nname: Berta\n---\n" },
    { path: "Roman/Codex/Locations/Labor.md", content: "---\ntype: location\nname: Labor\n---\n" },
  ]);
  const plan = createGenerationPlan(project, {
    scenes: true, sceneNotes: true, characters: true, locations: true,
  });
  const chapter = plan.artifacts.find((artifact) => artifact.path.endsWith("/1.canvas"));
  assert.ok(chapter);
  const canvas = JSON.parse(chapter.content) as {
    nodes: Array<{ id: string; type: string; file?: string }>;
    edges: Array<{ fromNode: string; toNode: string }>;
  };
  const nodeByFile = new Map(canvas.nodes.filter((node) => node.file).map((node) => [node.file, node.id]));
  const sceneId = nodeByFile.get("Roman/Scenes/Act 1/01-01 Begegnung.md");
  assert.ok(sceneId);
  for (const relatedPath of [
    "Roman/SceneNotes/Begegnung - Notes.md",
    "Roman/Codex/Characters/Ada.md",
    "Roman/Codex/Characters/Berta.md",
    "Roman/Codex/Locations/Labor.md",
  ]) {
    const relatedId = nodeByFile.get(relatedPath);
    assert.ok(relatedId, `missing related node ${relatedPath}`);
    assert.equal(
      canvas.edges.some((edge) => edge.fromNode === sceneId && edge.toNode === relatedId),
      true,
      `missing scene relation edge to ${relatedPath}`,
    );
  }
});

test("creates deterministic Canvas and master artifacts from the StoryLine fixture", () => {
  const project = parseStoryLineProject(fixtureRoot, readMarkdownDocuments(fixtureRoot));
  const selection = { scenes: true, sceneNotes: true, characters: true, locations: true };
  const first = createGenerationPlan(project, selection);
  const second = createGenerationPlan(project, selection);
  assert.deepEqual(first, second);
  assert.equal(first.artifacts.filter((artifact) => artifact.path.endsWith(".canvas")).length, 3);
  assert.equal(first.artifacts.some((artifact) => artifact.path.endsWith("/Canvas/Master.md")), true);
});

function readMarkdownDocuments(root: string): StoryLineSourceDocument[] {
  return walk(root)
    .filter((file) => file.endsWith(".md"))
    .map((file) => ({ path: file.replaceAll(path.sep, "/"), content: fs.readFileSync(file, "utf8") }));
}

function walk(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(entryPath) : [entryPath];
  });
}
