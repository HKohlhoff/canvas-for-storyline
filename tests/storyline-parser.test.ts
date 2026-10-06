import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { createGenerationPlan } from "../src/generation/plan/create";
import { parseStoryLineProject, type StoryLineSourceDocument } from "../src/storyline/parser";

const fixtureRoot = "tests/fixtures/storyline/Projekt-M";
const demoProjectRoot = "examples/demo-vault/StoryLine/Enchanted Forest/Little Red Riding Hood";
const demoCodexRoot = "examples/demo-vault/StoryLine/Enchanted Forest/Codex";

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

test("reads project, series, act, and chapter labels from StoryLine metadata", () => {
  const project = parseStoryLineProject("StoryLine/Serie/Projekt M", [
    {
      path: "StoryLine/Serie/Projekt M/Projekt M.md",
      content: [
        "---",
        "type: storyline",
        "title: Projekt M",
        "seriesId: Die Akademie",
        "actLabels:",
        '  "1": Mengen – Zugehörigkeit',
        "actDescriptions:",
        '  "1": Leere Menge beginnt ihre Reise.',
        "chapterLabels:",
        '  "1": Leerheit',
        "chapterDescriptions:",
        '  "1": Der Anfang der Geschichte.',
        "---",
      ].join("\n"),
    },
  ], { vaultName: "TestVault", seriesName: "Die Akademie", bookNumber: 1 });

  assert.equal(project.name, "Projekt M");
  assert.equal(project.vaultName, "TestVault");
  assert.equal(project.seriesName, "Die Akademie");
  assert.equal(project.bookNumber, 1);
  assert.deepEqual(project.actLabels, { "1": "Mengen – Zugehörigkeit" });
  assert.deepEqual(project.actDescriptions, { "1": "Leere Menge beginnt ihre Reise." });
  assert.deepEqual(project.chapterLabels, { "1": "Leerheit" });
  assert.deepEqual(project.chapterDescriptions, { "1": "Der Anfang der Geschichte." });
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

test("recognizes series-level Codex entries outside the project folder", () => {
  const project = parseStoryLineProject("StoryLine/Serie/Projekt M", [
    {
      path: "StoryLine/Serie/Codex/Characters/Agent M.md",
      content: "---\ntype: character\nname: Agent M\n---\n",
    },
  ]);

  assert.equal(project.elements[0]?.category, "characters");
  assert.equal(project.elements[0]?.sourcePath, "StoryLine/Serie/Codex/Characters/Agent M.md");
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
        "subtitle: Eine unerwartete Begegnung",
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
  assert.equal(scene.description, "Eine unerwartete Begegnung");
});

test("includes the StoryLine POV in scene character relationships", () => {
  const project = parseStoryLineProject("Roman", [{
    path: "Roman/Scenes/Act 1/01-01 Begegnung.md",
    content: [
      "---",
      "type: scene",
      "title: Begegnung",
      'pov: "[[Ada]]"',
      "characters:",
      '  - "[[Berta]]"',
      '  - "[[Ada]]"',
      "---",
    ].join("\n"),
  }]);

  assert.deepEqual(project.elements[0]?.characters, ["Berta", "Ada"]);
});

test("stores hover descriptions directly on reference-layout file cards", () => {
  const project = parseStoryLineProject("Roman", [
    {
      path: "Roman/Scenes/Act 1/01-01 Begegnung.md",
      content: "---\ntype: scene\ntitle: Begegnung\nsubtitle: Der erste Blick\nact: 1\nchapter: 1\nsequence: 1\n---\n",
    },
    {
      path: "Roman/Codex/Locations/Labor.md",
      content: "---\ntype: location\nname: Labor\ndescription: Ein heller Raum\n---\n",
    },
  ]);
  const scene = project.elements.find((element) => element.category === "scenes");
  const location = project.elements.find((element) => element.category === "locations");
  assert.equal(scene?.description, "Der erste Blick");
  assert.equal(location?.description, "Ein heller Raum");

  if (!scene || !location) assert.fail("expected scene and location");
  project.chapterDescriptions["1"] = "Der Anfang der Geschichte.";
  scene.locations = ["Labor"];
  const plan = createGenerationPlan(project, {
    scenes: true, sceneNotes: true, characters: true, locations: true,
  });
  const overview = plan.artifacts.find((artifact) => artifact.path.endsWith("Übersicht.canvas"));
  const chapter = plan.artifacts.find((artifact) => artifact.path.endsWith(".canvas") && artifact.path.includes("Kapitel"));
  assert.ok(overview);
  assert.ok(chapter);
  const overviewCanvas = JSON.parse(overview.content) as {
    nodes: Array<CanvasTestNode>;
  };
  const chapterCanvas = JSON.parse(chapter.content) as {
    nodes: Array<CanvasTestNode>;
  };
  assert.equal(
    overviewCanvas.nodes.find((node) => node.file?.endsWith(".canvas"))?.label,
    "Kapitel 1 · 1",
  );
  assert.equal(
    overviewCanvas.nodes.find((node) => node.file?.endsWith(".canvas"))?.cfsDescription,
    "Der Anfang der Geschichte.",
  );
  assert.equal(chapterCanvas.nodes.find((node) => node.file === scene.sourcePath)?.label, undefined);
  assert.equal(chapterCanvas.nodes.find((node) => node.file === location.sourcePath)?.label, undefined);
  const sceneFile = chapterCanvas.nodes.find((node) => node.file === scene.sourcePath);
  const locationFile = chapterCanvas.nodes.find((node) => node.file === location.sourcePath);
  assert.ok(sceneFile && locationFile);
  assert.equal(sceneFile.cfsDescription, "Der erste Blick");
  assert.equal(locationFile.cfsDescription, "Ein heller Raum");
  assert.equal(chapterCanvas.nodes.find((node) => node.file?.endsWith("Übersicht.canvas")), undefined);
  assert.match(
    chapterCanvas.nodes.find((node) => node.text?.includes("Farbcode aus StoryLine"))?.text ?? "",
    /^# .*<small>\(back to: \*\*\[\[Roman\/Canvas\/Roman - Übersicht\.canvas\|Canvas\]\]\*\*\)<\/small>/,
  );
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
  const chapter = plan.artifacts.find((artifact) => artifact.path.endsWith("/Roman - Kapitel 1 - 1.canvas"));
  assert.ok(chapter);
  const canvas = JSON.parse(chapter.content) as {
    nodes: Array<{ id: string; type: string; file?: string; label?: string }>;
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

test("demo vault exercises every exported category and StoryLine scene status", () => {
  const documents = [
    ...readMarkdownDocuments(demoProjectRoot),
    ...readMarkdownDocuments(demoCodexRoot),
  ];
  const project = parseStoryLineProject(demoProjectRoot, documents, {
    vaultName: "Canvas for StoryLine Demo",
    seriesName: "Tales from the Enchanted Forest",
    bookNumber: 1,
  });

  assert.equal(project.name, "Little Red Riding Hood");
  assert.equal(project.language, "en");
  assert.equal(project.bookNumber, 1);
  assert.deepEqual(new Set(project.elements.map((element) => element.category)), new Set([
    "scenes", "sceneNotes", "characters", "locations",
  ]));
  assert.deepEqual(
    new Set(project.elements.filter((element) => element.category === "scenes").map((element) => element.status)),
    new Set(["idea", "outlined", "draft", "written", "revised", "final"]),
  );
  assert.equal(project.elements.filter((element) => element.category === "scenes").length, 6);
  assert.equal(project.elements.filter((element) => element.category === "sceneNotes").length, 6);
  assert.equal(project.elements.filter((element) => element.category === "characters").length, 5);
  assert.equal(project.elements.filter((element) => element.category === "locations").length, 5);

  const sceneNotes = new Set(project.elements
    .filter((element) => element.category === "sceneNotes")
    .map((element) => path.basename(element.sourcePath).toLocaleLowerCase("en")));
  const characters = new Set(project.elements
    .filter((element) => element.category === "characters")
    .map((element) => element.title.toLocaleLowerCase("en")));
  const locations = new Set(project.elements
    .filter((element) => element.category === "locations")
    .map((element) => element.title.toLocaleLowerCase("en")));
  for (const scene of project.elements.filter((element) => element.category === "scenes")) {
    assert.ok(scene.notesFile);
    assert.equal(sceneNotes.has(path.basename(scene.notesFile).toLocaleLowerCase("en")), true);
    assert.equal(scene.characters?.every((name) => characters.has(name.toLocaleLowerCase("en"))), true);
    assert.equal(scene.locations?.every((name) => locations.has(name.toLocaleLowerCase("en"))), true);
  }

  const plan = createGenerationPlan(project, {
    scenes: true, sceneNotes: true, characters: true, locations: true,
  });
  assert.equal(plan.artifacts.filter((artifact) => artifact.path.endsWith(".canvas")).length, 7);
  assert.equal(plan.artifacts.some((artifact) => artifact.path.endsWith("/Canvas/Master.md")), true);
  assert.equal(plan.artifacts.some((artifact) => artifact.path.endsWith("Little Red Riding Hood - Overview.canvas")), true);
  assert.equal(plan.artifacts.some((artifact) => artifact.path.includes(" - Chapter 1 - ")), true);
  const overview = JSON.parse(plan.artifacts[0]?.content ?? "{}") as {
    name?: string;
    nodes?: Array<{ label?: string; text?: string }>;
  };
  assert.equal(overview.name, "Overview");
  assert.equal(overview.nodes?.some((node) => node.label?.startsWith("Act 1 · ")), true);
  assert.match(overview.nodes?.find((node) => node.text)?.text ?? "", /> \[!info\] StoryLine color code/);
  const chapter = JSON.parse(plan.artifacts[1]?.content ?? "{}") as {
    name?: string;
    nodes?: Array<{ label?: string }>;
  };
  assert.match(chapter.name ?? "", /^Chapter 1 - /);
  assert.equal(chapter.nodes?.some((node) => node.label === "Characters and POV"), true);
  const master = plan.artifacts.find((artifact) => artifact.path.endsWith("/Canvas/Master.md"))?.content ?? "";
  assert.equal(master.startsWith("> [!info] Sources and creation\n"), true);
  assert.match(master, /^# Act 1 · The Errand$/m);
  assert.match(master, /^## Chapter 1 · A Basket for Grandmother$/m);
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

interface CanvasTestNode {
  type: string;
  file?: string;
  label?: string;
  text?: string;
  color?: string;
  cfsDescription?: string;
  x: number;
  y: number;
  width: number;
  height: number;
}
