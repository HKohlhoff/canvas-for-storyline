import type { StoryLineElement, StoryLineProject } from "../../model/storyline";
import type { MasterSceneLinkMode } from "../../settings-data";

export function renderMaster(
  project: StoryLineProject,
  elements: readonly StoryLineElement[],
  createdAt: Date = new Date(),
  sceneLinkMode: MasterSceneLinkMode = "wikilinks",
): string {
  const english = isEnglish(project);
  const lines = [
    english ? "> [!info] Sources and creation" : "> [!info] Quellen und Erstellung",
    `> Vault: **${project.vaultName ?? (english ? "Unknown" : "Unbekannt")}**`,
    `> ${english ? "StoryLine project folder" : "StoryLine-Projektordner"}: \`${project.rootPath}\``,
    `> ${english ? "Created on" : "Erstellt am"}: ${formatDate(createdAt, project)}`,
    "",
  ];
  const scenes = elements.filter((element) => element.category === "scenes");
  const acts = [...new Set(scenes.map((scene) => scene.act))];
  for (const act of acts) {
    const actLabel = act === undefined
      ? (english ? "Without Act" : "Ohne Akt")
      : `${english ? "Act" : "Akt"} ${act}${project.actLabels[String(act)] ? ` · ${project.actLabels[String(act)]}` : ""}`;
    lines.push(`# ${actLabel}`, "");
    const actScenes = scenes.filter((candidate) => candidate.act === act);
    const chapters = [...new Set(actScenes.map((scene) => scene.chapter))];
    for (const chapter of chapters) {
      const chapterLabel = chapter === null
        ? (english ? "Without Chapter" : "Ohne Kapitel")
        : `${english ? "Chapter" : "Kapitel"} ${chapter}${project.chapterLabels[chapter] ? ` · ${project.chapterLabels[chapter]}` : ""}`;
      lines.push(`## ${chapterLabel}`, "");
      for (const scene of actScenes.filter((candidate) => candidate.chapter === chapter)) {
        const prefix = sceneLinkMode === "embeds" ? "!" : "";
        lines.push(`### ${escapeHeading(scene.title)}`, `${prefix}[[${linkTarget(scene.sourcePath)}]]`, "");
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

function formatDate(value: Date, project: StoryLineProject): string {
  return new Intl.DateTimeFormat(isEnglish(project) ? "en-US" : "de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(value);
}

function isEnglish(project: StoryLineProject): boolean {
  return project.language?.toLowerCase().startsWith("en") ?? false;
}
