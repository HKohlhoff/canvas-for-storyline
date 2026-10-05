import { PluginSettingTab, Setting, type App } from "obsidian";
import type CanvasForStoryLinePlugin from "../main";
import { CATEGORY_LABELS, type StoryLineCategory } from "../model/storyline";

export class CanvasForStoryLineSettingTab extends PluginSettingTab {
  constructor(app: App, private readonly plugin: CanvasForStoryLinePlugin) {
    super(app, plugin);
  }

  display(): void {
    this.containerEl.empty();
    new Setting(this.containerEl)
      .setName("StoryLine project folder")
      .setDesc("Vault-relative folder. Generated files are written to its direct Canvas subfolder.")
      .addText((text) => text
        .setPlaceholder("Projects/My Story")
        .setValue(this.plugin.settings.projectPath)
        .onChange(async (value) => {
          this.plugin.settings.projectPath = value;
          await this.plugin.saveSettings();
        }));

    new Setting(this.containerEl).setName("Included StoryLine elements").setHeading();
    for (const category of ["scenes", "sceneNotes", "characters", "locations"] as const) {
      this.addCategoryToggle(category);
    }
  }

  private addCategoryToggle(category: StoryLineCategory): void {
    new Setting(this.containerEl)
      .setName(CATEGORY_LABELS[category])
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.includedCategories[category])
        .onChange(async (value) => {
          this.plugin.settings.includedCategories[category] = value;
          await this.plugin.saveSettings();
        }));
  }
}
