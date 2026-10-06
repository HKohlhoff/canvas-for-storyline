import fs from "node:fs";
import path from "node:path";
import { createGenerationPlan } from "../src/generation/plan/create";
import { parseStoryLineProject, type StoryLineSourceDocument } from "../src/storyline/parser";

const vaultRoot = "examples/demo-vault";
const projectRoot = "StoryLine/Enchanted Forest/Little Red Riding Hood";
const codexRoot = "StoryLine/Enchanted Forest/Codex";
const seriesPath = path.join(vaultRoot, "StoryLine/Enchanted Forest/series.json");
const series = JSON.parse(fs.readFileSync(seriesPath, "utf8")) as {
  name?: string;
  bookOrder?: string[];
};
const documents = [
  ...readMarkdownDocuments(projectRoot),
  ...readMarkdownDocuments(codexRoot),
];
const projectSegments = projectRoot.split("/");
const projectName = projectSegments[projectSegments.length - 1] ?? projectRoot;
const bookIndex = series.bookOrder?.indexOf(projectName) ?? -1;
const project = parseStoryLineProject(projectRoot, documents, {
  vaultName: "Canvas for StoryLine Demo",
  ...(series.name ? { seriesName: series.name } : {}),
  ...(bookIndex >= 0 ? { bookNumber: bookIndex + 1 } : {}),
});
const plan = createGenerationPlan(project, {
  scenes: true,
  sceneNotes: true,
  characters: true,
  locations: true,
});

for (const artifact of plan.artifacts) {
  const outputPath = path.join(vaultRoot, artifact.path);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, artifact.content, "utf8");
  console.log(`Generated ${artifact.path}`);
}

function readMarkdownDocuments(vaultPath: string): StoryLineSourceDocument[] {
  const diskPath = path.join(vaultRoot, vaultPath);
  return walk(diskPath)
    .filter((file) => file.endsWith(".md"))
    .map((file) => ({
      path: path.relative(vaultRoot, file).replaceAll(path.sep, "/"),
      content: fs.readFileSync(file, "utf8"),
    }));
}

function walk(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(entryPath) : [entryPath];
  });
}
