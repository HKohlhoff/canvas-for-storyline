import type { StoryLineElement, StoryLineProject } from "../../model/storyline";

export function renderMaster(
  project: StoryLineProject,
  elements: readonly StoryLineElement[],
  createdAt: Date = new Date(),
): string {
  const lines = [
    "> [!info] Quellen und Erstellung",
    `> Vault: **${project.vaultName ?? "Unbekannt"}**`,
    `> StoryLine-Projektordner: \`${project.rootPath}\``,
    `> Erstellt am: ${formatDate(createdAt)}`,
    "",
  ];
  const scenes = elements.filter((element) => element.category === "scenes");
  const acts = [...new Set(scenes.map((scene) => scene.act))];
  for (const act of acts) {
    const actLabel = act === undefined
      ? "Ohne Akt"
      : `Akt ${act}${project.actLabels[String(act)] ? ` · ${project.actLabels[String(act)]}` : ""}`;
    lines.push(`# ${actLabel}`, "");
    const actScenes = scenes.filter((candidate) => candidate.act === act);
    const chapters = [...new Set(actScenes.map((scene) => scene.chapter))];
    for (const chapter of chapters) {
      const chapterLabel = chapter === null
        ? "Ohne Kapitel"
        : `Kapitel ${chapter}${project.chapterLabels[chapter] ? ` · ${project.chapterLabels[chapter]}` : ""}`;
      lines.push(`## ${chapterLabel}`, "");
      for (const scene of actScenes.filter((candidate) => candidate.chapter === chapter)) {
        lines.push(`### ${escapeHeading(scene.title)}`, `[[${linkTarget(scene.sourcePath)}]]`, "");
      }
    }
  }
  if (lines[lines.length - 1] === "") lines.pop();
  return `${lines.join("\n")}\n`;
}

function linkTarget(path: string): string {
  return path.replace(/\.md$/i, "");
}

function escapeHeading(value: string): string {
  return value.replace(/\r?\n/g, " ").trim();
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(value);
}
