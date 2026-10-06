import { Notice, Plugin } from "obsidian";
import { createCanvasGenerationPlan, createMasterGenerationPlan } from "./generation/plan/create";
import type { GenerationPlan } from "./generation/plan/types";
import { GenerationRunGuard } from "./generation/run-guard";
import { normalizePluginData, type CanvasForStoryLineData } from "./plugin-data";
import { normalizeSettings, type CanvasForStoryLineSettings } from "./settings-data";
import { readStoryLineProject } from "./storyline/reader";
import { CanvasForStoryLineSettingTab } from "./ui/settings-tab";
import { CanvasDescriptionTooltipController } from "./ui/canvas-description-tooltips";
import { writeGenerationPlan } from "./vault/write-plan";
import { CURRENT_UPDATE_ID } from "./update-note-content";
import { UpdateNoteModal } from "./ui/update-note-modal";
import { openPluginReadme } from "./ui/readme-modal";

export default class CanvasForStoryLinePlugin extends Plugin {
  settings: CanvasForStoryLineSettings = normalizeSettings({});
  private data: CanvasForStoryLineData = normalizePluginData({});
  private readonly generationRunGuard = new GenerationRunGuard();
  private readonly descriptionTooltips = new CanvasDescriptionTooltipController(this.app, this);
  private updateNoteOpen = false;

  async onload(): Promise<void> {
    this.data = normalizePluginData(await this.loadData());
    this.settings = this.data.settings;
    this.descriptionTooltips.start();
    void this.descriptionTooltips.refreshFromVault(this.settings.projectPath);
    this.addSettingTab(new CanvasForStoryLineSettingTab(this.app, this));
    this.addCommand({
      id: "generate-storyline-canvases",
      name: "Create StoryLine Canvas files",
      callback: () => { void this.requestGeneration("canvases"); },
    });
    this.addCommand({
      id: "generate-storyline-master",
      name: "Create StoryLine master file",
      callback: () => { void this.requestGeneration("master"); },
    });
    this.app.workspace.onLayoutReady(() => this.showUpdateNoteIfNeeded());
  }

  async saveSettings(): Promise<void> {
    this.settings = normalizeSettings(this.settings);
    this.data.settings = this.settings;
    await this.saveData(this.data);
    void this.descriptionTooltips.refreshFromVault(this.settings.projectPath);
  }

  showLastUpdate(): void {
    this.openUpdateNote();
  }

  showReadme(): void {
    openPluginReadme(this.app);
  }

  private showUpdateNoteIfNeeded(): void {
    if (this.data.ui.lastShownUpdateId !== CURRENT_UPDATE_ID) this.openUpdateNote();
  }

  private openUpdateNote(): void {
    if (this.updateNoteOpen) return;
    this.updateNoteOpen = true;
    new UpdateNoteModal(this.app, () => {
      this.updateNoteOpen = false;
      this.data.ui.lastShownUpdateId = CURRENT_UPDATE_ID;
      void this.saveData(this.data);
    }).open();
  }

  private async requestGeneration(kind: "canvases" | "master"): Promise<void> {
    const started = await this.generationRunGuard.run(() => this.generateArtifacts(kind));
    if (!started) {
      new Notice("Canvas for StoryLine is already generating files. Try again when it has finished.");
    }
  }

  private async generateArtifacts(kind: "canvases" | "master"): Promise<void> {
    const projectPath = this.settings.projectPath;
    if (!projectPath) {
      new Notice("Choose a StoryLine project folder in the Canvas for StoryLine settings.");
      return;
    }
    try {
      const project = await readStoryLineProject(this.app.vault, projectPath);
      const plan = kind === "master"
        ? createMasterGenerationPlan(project, this.settings.masterOutputPath)
        : this.canvasPlan(project);
      const result = await writeGenerationPlan(
        this.app.vault,
        this.app.fileManager,
        plan,
        this.data.projects[projectPath],
        async (ownership) => {
          this.data.projects[projectPath] = ownership;
          await this.saveData(this.data);
        },
      );
      this.data.projects[projectPath] = result.ownership;
      await this.saveData(this.data);
      if (kind === "canvases") this.descriptionTooltips.refreshFromPlan(plan);
      const changed = result.created.length + result.updated.length;
      const removed = result.removed.length;
      if (result.conflicts.length > 0) {
        new Notice(
          `Canvas for StoryLine created ${changed} file(s), removed ${removed} obsolete file(s), and found ${result.conflicts.length} blocked output path(s).`,
          8000,
        );
      } else {
        new Notice(`Canvas for StoryLine finished: ${changed} file(s) created, ${removed} obsolete file(s) removed.`);
      }
    } catch (error) {
      console.error("Canvas for StoryLine generation failed", error);
      new Notice(`Canvas for StoryLine failed: ${errorMessage(error)}`, 8000);
    }
  }

  private canvasPlan(project: Awaited<ReturnType<typeof readStoryLineProject>>): GenerationPlan {
    const canvasPlan = createCanvasGenerationPlan(project, this.settings.includedCategories);
    if (!this.settings.createMasterWithCanvases) return canvasPlan;
    const masterPlan = createMasterGenerationPlan(project, this.settings.masterOutputPath);
    return { ...canvasPlan, artifacts: [...canvasPlan.artifacts, ...masterPlan.artifacts] };
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
