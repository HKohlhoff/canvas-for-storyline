import assert from "node:assert/strict";
import test from "node:test";
import {
  createCanvasGenerationPlan,
  createGenerationPlan,
  createMasterGenerationPlan,
  safeFileName,
} from "../src/generation/plan/create";
import { obsoleteOwnedCanvasPaths } from "../src/generation/plan/obsolete";
import type { StoryLineProject } from "../src/model/storyline";

const project: StoryLineProject = {
  name: "Projekt M",
  vaultName: "TestVault",
  seriesName: "Die Akademie",
  bookNumber: 1,
  rootPath: "Romane/Projekt M",
  actLabels: { "1": "Mengen – Zugehörigkeit" },
  actDescriptions: { "1": "Der erste Akt." },
  chapterLabels: { "1": "Leerheit" },
  chapterDescriptions: { "1": "Leere Menge sucht ihren Platz." },
  elements: [
    { id: "s1", category: "scenes", title: "Ankunft", sourcePath: "Romane/Projekt M/Szenen/Ankunft.md", chapter: "1", act: 1, status: "draft" },
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
    "Romane/Projekt M/Canvas/Projekt M - Übersicht.canvas",
    "Romane/Projekt M/Canvas/Projekt M - Kapitel 1 - Leerheit.canvas",
    "Romane/Projekt M/Canvas/Master.md",
  ]);
  const overview = JSON.parse(plan.artifacts[0]?.content ?? "{}") as {
    nodes: Array<{ id: string; type: string }>;
    edges: Array<{ id: string; fromNode: string; toNode: string }>;
  };
  assert.equal(overview.nodes.length, 3);
  assert.equal(new Set(overview.nodes.map((node) => node.id)).size, overview.nodes.length);
  assert.equal(new Set(overview.edges.map((edge) => edge.id)).size, overview.edges.length);
  const nodeIds = new Set(overview.nodes.map((node) => node.id));
  assert.equal(overview.edges.every((edge) => nodeIds.has(edge.fromNode) && nodeIds.has(edge.toNode)), true);
  const overviewHeaderNode = (JSON.parse(plan.artifacts[0]?.content ?? "{}") as {
    nodes: Array<{ type: string; text?: string; height?: number }>;
  }).nodes.find((node) => node.type === "text");
  const overviewHeader = overviewHeaderNode?.text ?? "";
  assert.equal(overviewHeaderNode?.height, 200);
  assert.equal(overviewHeader.split("\n")[0], "# Buch 1 - Projekt M - Übersicht");
  assert.match(overviewHeader, /> \[!info\] Farbcode aus StoryLine/);
  assert.match(overviewHeader, /\[Grau\]\(cfs-color:\/\/idea\) – Idea \(Idee\)/);
  assert.match(overviewHeader, /\[Rot\]\(cfs-color:\/\/final\) – Final \(fertig\)/);
  assert.doesNotMatch(overviewHeader, /<span|<strong/);
  const master = plan.artifacts[plan.artifacts.length - 1]?.content ?? "";
  assert.match(master, /> \[!info\] Quellen und Erstellung/);
  assert.equal(master.startsWith("> [!info] Quellen und Erstellung\n"), true);
  assert.match(master, /> Vault: \*\*TestVault\*\*/);
  assert.match(master, /> StoryLine-Projektordner: `Romane\/Projekt M`/);
  assert.match(master, /> Erstellt am: \d{2}\.\d{2}\.\d{4}/);
  assert.match(master, /# Akt 1 · Mengen – Zugehörigkeit/);
  assert.match(master, /## Kapitel 1 · Leerheit/);
  assert.match(master, /### Ankunft\n\[\[Romane\/Projekt M\/Szenen\/Ankunft\]\]/);
  assert.doesNotMatch(master, /<!--/);
  const chapter = JSON.parse(plan.artifacts[1]?.content ?? "{}") as {
    nodes: Array<{
      type: string;
      label?: string;
      color?: string;
      file?: string;
      text?: string;
      borderStyle?: string;
      cfsDescription?: string;
      x: number;
      y: number;
      width: number;
      height: number;
    }>;
  };
  const categoryLabels = new Set(["Kapitel 1 · Leerheit", "Szenen", "Szenen-Notizen", "Figuren und POV", "Orte"]);
  assert.deepEqual(
    chapter.nodes
      .filter((node) => node.type === "group" && categoryLabels.has(node.label ?? ""))
      .map((node) => [node.label, node.color]),
    [
      ["Kapitel 1 · Leerheit", "4"],
      ["Szenen", "4"],
      ["Szenen-Notizen", "2"],
      ["Figuren und POV", "6"],
      ["Orte", "5"],
    ],
  );
  const sceneCard = chapter.nodes.find((node) => node.file?.endsWith("Ankunft.md"));
  assert.equal(sceneCard?.color, "#FF9800");
  assert.equal(
    overview.nodes.find((node) => node.type === "file") &&
      (JSON.parse(plan.artifacts[0]?.content ?? "{}") as { nodes: Array<{ type: string; label?: string }> })
        .nodes.find((node) => node.type === "file")?.label,
    "Kapitel 1 · Leerheit",
  );
  const overviewLayout = (JSON.parse(plan.artifacts[0]?.content ?? "{}") as {
    nodes: Array<{ type: string; label?: string; file?: string; cfsDescription?: string; x: number; y: number; width: number; height: number }>;
  }).nodes;
  const overviewCard = overviewLayout.find((node) => node.file?.endsWith("Projekt M - Kapitel 1 - Leerheit.canvas"));
  assert.ok(overviewCard);
  assert.equal(overviewCard.cfsDescription, "Leere Menge sucht ihren Platz.");
  assert.equal(overviewLayout.find((node) => node.type === "group")?.height, 340);
  const chapterNavigation = chapter.nodes.find((node) => node.file?.endsWith("Übersicht.canvas"));
  assert.equal(chapterNavigation?.label, "← Übersicht");
  const chapterColorInfo = chapter.nodes.find((node) => node.text?.includes("Farbcode aus StoryLine"));
  assert.ok(chapterColorInfo);
  assert.equal(chapterColorInfo.x - ((chapterNavigation?.x ?? 0) + (chapterNavigation?.width ?? 0)), 80);
  assert.equal(chapterColorInfo.y, chapterNavigation?.y);
  assert.equal(chapterColorInfo.height, chapterNavigation?.height);
  assert.match(chapterColorInfo.text ?? "", /\[Grau\]\(cfs-color:\/\/idea\)/);
  assert.match(chapterColorInfo.text ?? "", /\[Rot\]\(cfs-color:\/\/final\)/);
  const categoryGroups = chapter.nodes.filter(
    (node) => node.type === "group" && node.label !== "Kapitel 1 · Leerheit",
  );
  assert.deepEqual(categoryGroups.map((node) => node.height), [420, 420, 420, 420]);
  assert.equal(
    chapter.nodes.find((node) => node.label === "Kapitel 1 · Leerheit")?.height,
    580,
  );
});

test("master output contains only scene links without embeds", () => {
  const plan = createGenerationPlan(project, {
    scenes: true, sceneNotes: false, characters: false, locations: false,
  });
  const master = plan.artifacts.find((artifact) => artifact.path.endsWith("Master.md"))?.content ?? "";
  assert.match(master, /\[\[Romane\/Projekt M\/Szenen\/Ankunft\]\]/);
  assert.doesNotMatch(master, /!\[\[/);
  assert.doesNotMatch(master, /Mara|Akademie|Hinweis/);
});

test("uses the overview's 100-unit free vertical gap on chapter cards", () => {
  const plan = createCanvasGenerationPlan({
    ...project,
    elements: [
      ...project.elements,
      {
        id: "s2",
        category: "scenes",
        title: "Begegnung",
        sourcePath: "Romane/Projekt M/Szenen/Begegnung.md",
        chapter: "1",
        act: 1,
        status: "outlined",
      },
    ],
  }, {
    scenes: true, sceneNotes: true, characters: true, locations: true,
  });
  const chapter = JSON.parse(plan.artifacts[1]?.content ?? "{}") as {
    nodes: Array<{ type?: string; label?: string; file?: string; y: number; height: number }>;
  };
  const first = chapter.nodes.find((node) => node.file?.endsWith("Ankunft.md"));
  const second = chapter.nodes.find((node) => node.file?.endsWith("Begegnung.md"));
  assert.ok(first);
  assert.ok(second);
  assert.equal(second.y - (first.y + first.height), 100);
  const columnHeights = chapter.nodes
    .filter((node) => ["Szenen", "Szenen-Notizen", "Figuren und POV", "Orte"].includes(node.label ?? ""))
    .map((node) => node.height);
  assert.deepEqual(columnHeights, [760, 760, 760, 760]);
});

test("uses the longest act column height for every overview column", () => {
  const plan = createCanvasGenerationPlan({
    ...project,
    chapterLabels: { "1": "Eins", "2": "Zwei", "3": "Drei", "4": "Vier" },
    elements: [
      project.elements[0] as StoryLineProject["elements"][number],
      { id: "s2", category: "scenes", title: "Zwei", sourcePath: "Romane/Projekt M/Szenen/2.md", chapter: "2", act: 1 },
      { id: "s3", category: "scenes", title: "Drei", sourcePath: "Romane/Projekt M/Szenen/3.md", chapter: "3", act: 1 },
      { id: "s4", category: "scenes", title: "Vier", sourcePath: "Romane/Projekt M/Szenen/4.md", chapter: "4", act: 2 },
    ],
  }, {
    scenes: true, sceneNotes: true, characters: true, locations: true,
  });
  const overview = JSON.parse(plan.artifacts[0]?.content ?? "{}") as {
    nodes: Array<{ type: string; height: number }>;
  };
  assert.deepEqual(
    overview.nodes.filter((node) => node.type === "group").map((node) => node.height),
    [980, 980],
  );
});

test("creates Canvas and master plans independently", () => {
  const selection = { scenes: true, sceneNotes: true, characters: true, locations: true };
  assert.equal(createCanvasGenerationPlan(project, selection).artifacts.some((artifact) => artifact.path.endsWith(".md")), false);
  assert.deepEqual(createMasterGenerationPlan(project).artifacts.map((artifact) => artifact.path), [
    "Romane/Projekt M/Canvas/Master.md",
  ]);
  assert.deepEqual(createMasterGenerationPlan(project, "Exports/Projekt M").artifacts.map((artifact) => artifact.path), [
    "Exports/Projekt M/Master.md",
  ]);
  assert.equal(createGenerationPlan(project, selection, false).artifacts.some((artifact) => artifact.path.endsWith(".md")), false);
});

test("chapter names are made safe for Vault file names", () => {
  assert.equal(safeFileName("Teil 1: Anfang/Ende"), "Teil 1- Anfang-Ende");
});

test("identifies obsolete owned Canvas files after project-based renaming", () => {
  const plan = createCanvasGenerationPlan(project, {
    scenes: true, sceneNotes: true, characters: true, locations: true,
  });
  assert.deepEqual(obsoleteOwnedCanvasPaths(plan, {
    artifacts: {
      "Romane/Projekt M/Canvas/Die Akademie - Übersicht.canvas": { hash: "old" },
      "Romane/Projekt M/Canvas/Die Akademie - Kapitel 1 - Leerheit.canvas": { hash: "old" },
      "Romane/Projekt M/Canvas/Projekt M - Übersicht.canvas": { hash: "current" },
      "Romane/Projekt M/Canvas/Vorgaben/Referenz.canvas": { hash: "reference" },
      "Romane/Projekt M/Canvas/Master.md": { hash: "master" },
    },
  }), [
    "Romane/Projekt M/Canvas/Die Akademie - Kapitel 1 - Leerheit.canvas",
    "Romane/Projekt M/Canvas/Die Akademie - Übersicht.canvas",
  ]);
});

test("does not plan colliding Canvas paths for reserved or sanitized chapter names", () => {
  const collidingProject: StoryLineProject = {
    name: "Roman",
    rootPath: "Roman",
    actLabels: {},
    actDescriptions: {},
    chapterLabels: {},
    chapterDescriptions: {},
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
    actLabels: {},
    actDescriptions: {},
    chapterLabels: {},
    chapterDescriptions: {},
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
    [
      "Roman/Canvas/Roman - Übersicht.canvas",
      "Roman/Canvas/Roman - Kapitel 2 - 2.canvas",
      "Roman/Canvas/Roman - Kapitel 10 - 10.canvas",
    ],
  );
  const master = plan.artifacts.find((artifact) => artifact.path.endsWith("Master.md"))?.content ?? "";
  assert.ok(master.indexOf("99-99 Frueher") < master.indexOf("00-01 Spaeter"));
});
