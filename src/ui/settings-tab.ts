import { PluginSettingTab, Setting, type App, type TextComponent } from "obsidian";
import type CanvasForStoryLinePlugin from "../main";
import { CATEGORY_LABELS, type StoryLineCategory } from "../model/storyline";
import { VaultFolderSuggestModal } from "./vault-folder-suggest-modal";
import {
  SHOW_LAST_UPDATE_DESCRIPTION,
  SHOW_LAST_UPDATE_LABEL,
} from "../update-note-content";

export class CanvasForStoryLineSettingTab extends PluginSettingTab {
  constructor(app: App, private readonly plugin: CanvasForStoryLinePlugin) {
    super(app, plugin);
  }

  display(): void {
    this.containerEl.empty();
    new Setting(this.containerEl).setName("Canvas files").setHeading();
    let projectPathInput: TextComponent | null = null;
    const projectFolderSetting = new Setting(this.containerEl)
      .setName("StoryLine project folder")
      .setDesc("Choose a folder inside this vault. Generated files are written to its direct Canvas subfolder.");
    projectFolderSetting.addText((text) => {
      projectPathInput = text;
      text
        .setPlaceholder("Projects/My Story")
        .setValue(this.plugin.settings.projectPath)
        .onChange(async (value) => {
          this.plugin.settings.projectPath = value;
          await this.plugin.saveSettings();
        });
    });
    projectFolderSetting.addButton((button) => button
      .setButtonText("Choose")
      .setTooltip("Choose a folder from this vault")
      .onClick(() => {
        new VaultFolderSuggestModal(this.app, async (path) => {
          projectPathInput?.setValue(path);
          this.plugin.settings.projectPath = path;
          await this.plugin.saveSettings();
        }, "Choose a StoryLine project folder").open();
      }));

    new Setting(this.containerEl).setName("Included StoryLine elements").setHeading();
    for (const category of ["scenes", "sceneNotes", "characters", "locations"] as const) {
      this.addCategoryToggle(category);
    }

    new Setting(this.containerEl).setName("Master file").setHeading();
    let masterPathInput: TextComponent | null = null;
    const masterFolderSetting = new Setting(this.containerEl)
      .setName("Master output folder")
      .setDesc("Choose a folder inside this vault. When empty, Master.md is created in the StoryLine project's Canvas folder.");
    masterFolderSetting.addText((text) => {
      masterPathInput = text;
      text
        .setPlaceholder("Exports/My Story")
        .setValue(this.plugin.settings.masterOutputPath)
        .onChange(async (value) => {
          this.plugin.settings.masterOutputPath = value;
          await this.plugin.saveSettings();
        });
    });
    masterFolderSetting.addButton((button) => button
      .setButtonText("Choose")
      .setTooltip("Choose the Master output folder")
      .onClick(() => {
        new VaultFolderSuggestModal(this.app, async (path) => {
          masterPathInput?.setValue(path);
          this.plugin.settings.masterOutputPath = path;
          await this.plugin.saveSettings();
        }, "Choose the Master output folder").open();
      }));

    new Setting(this.containerEl)
      .setName("Scene inclusion")
      .setDesc("Choose whether Master.md contains ordinary scene links or embeds the complete scene notes.")
      .addDropdown((dropdown) => dropdown
        .addOption("wikilinks", "Wikilinks")
        .addOption("embeds", "Embedded notes")
        .setValue(this.plugin.settings.masterSceneLinkMode)
        .onChange(async (value) => {
          this.plugin.settings.masterSceneLinkMode = value === "embeds" ? "embeds" : "wikilinks";
          await this.plugin.saveSettings();
        }));

    new Setting(this.containerEl)
      .setName("Create master file with Canvas files")
      .setDesc("When enabled, the Canvas command also recreates Master.md. The separate master command always recreates it.")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.createMasterWithCanvases)
        .onChange(async (value) => {
          this.plugin.settings.createMasterWithCanvases = value;
          await this.plugin.saveSettings();
        }));

    new Setting(this.containerEl).setName("About").setHeading();
    new Setting(this.containerEl)
      .setName("Last update")
      .setDesc(SHOW_LAST_UPDATE_DESCRIPTION)
      .addButton((button) => button
        .setButtonText(SHOW_LAST_UPDATE_LABEL)
        .onClick(() => this.plugin.showLastUpdate()));
    new Setting(this.containerEl)
      .setName("README")
      .setDesc("Open the complete plugin documentation without leaving Obsidian.")
      .addButton((button) => button
        .setButtonText("Show readme")
        .onClick(() => this.plugin.showReadme()));
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
