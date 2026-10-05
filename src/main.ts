import { Notice, Plugin } from "obsidian";
import { createGenerationPlan } from "./generation/plan/create";
import { GenerationRunGuard } from "./generation/run-guard";
import { normalizePluginData, type CanvasForStoryLineData } from "./plugin-data";
import { normalizeSettings, type CanvasForStoryLineSettings } from "./settings-data";
import { readStoryLineProject } from "./storyline/reader";
import { CanvasForStoryLineSettingTab } from "./ui/settings-tab";
import { writeGenerationPlan } from "./vault/write-plan";

export default class CanvasForStoryLinePlugin extends Plugin {
  settings: CanvasForStoryLineSettings = normalizeSettings({});
  private data: CanvasForStoryLineData = normalizePluginData({});
  private readonly generationRunGuard = new GenerationRunGuard();

  async onload(): Promise<void> {
    this.data = normalizePluginData(await this.loadData());
    this.settings = this.data.settings;
    this.addSettingTab(new CanvasForStoryLineSettingTab(this.app, this));
    this.addCommand({
      id: "generate-storyline-artifacts",
      name: "Generate or update StoryLine Canvas files and master note",
      callback: () => { void this.requestGeneration(); },
    });
  }

  async saveSettings(): Promise<void> {
    this.settings = normalizeSettings(this.settings);
    this.data.settings = this.settings;
    await this.saveData(this.data);
  }

  private async requestGeneration(): Promise<void> {
    const started = await this.generationRunGuard.run(() => this.generateArtifacts());
    if (!started) {
      new Notice("Canvas for StoryLine is already generating files. Try again when it has finished.");
    }
  }

  private async generateArtifacts(): Promise<void> {
    const projectPath = this.settings.projectPath;
    if (!projectPath) {
      new Notice("Choose a StoryLine project folder in the Canvas for StoryLine settings.");
      return;
    }
    try {
      const project = await readStoryLineProject(this.app.vault, projectPath);
      const plan = createGenerationPlan(project, this.settings.includedCategories);
      const result = await writeGenerationPlan(
        this.app.vault,
        plan,
        this.data.projects[projectPath],
        async (ownership) => {
          this.data.projects[projectPath] = ownership;
          await this.saveData(this.data);
        },
      );
      this.data.projects[projectPath] = result.ownership;
      await this.saveData(this.data);
      const changed = result.created.length + result.updated.length;
      if (result.conflicts.length > 0) {
        new Notice(
          `Canvas for StoryLine wrote ${changed} file(s) and left ${result.conflicts.length} changed or unowned file(s) untouched.`,
          8000,
        );
      } else {
        new Notice(`Canvas for StoryLine finished: ${changed} file(s) written.`);
      }
    } catch (error) {
      console.error("Canvas for StoryLine generation failed", error);
      new Notice(`Canvas for StoryLine failed: ${errorMessage(error)}`, 8000);
    }
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
