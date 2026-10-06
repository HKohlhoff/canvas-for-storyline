import {
  PluginSettingTab,
  type App,
  type SettingDefinition,
  type SettingDefinitionItem,
  type TextComponent,
} from "obsidian";
import type CanvasForStoryLinePlugin from "../main";
import { CATEGORY_LABELS } from "../model/storyline";
import { VaultFolderSuggestModal } from "./vault-folder-suggest-modal";
import {
  SHOW_LAST_UPDATE_DESCRIPTION,
  SHOW_LAST_UPDATE_LABEL,
} from "../update-note-content";

type SettingKey =
  | "projectPath"
  | "includeScenes"
  | "includeSceneNotes"
  | "includeCharacters"
  | "includeLocations"
  | "masterOutputPath"
  | "masterSceneLinkMode"
  | "createMasterWithCanvases";

export class CanvasForStoryLineSettingTab extends PluginSettingTab {
  constructor(app: App, private readonly plugin: CanvasForStoryLinePlugin) {
    super(app, plugin);
  }

  getSettingDefinitions(): SettingDefinitionItem<SettingKey>[] {
    return [
      {
        type: "group",
        heading: "Canvas files",
        items: [
          this.folderSetting(
            "projectPath",
            "StoryLine project folder",
            "Choose a folder inside this vault. Generated files are written to its direct Canvas subfolder.",
            "Projects/My Story",
            "Choose a StoryLine project folder",
          ),
        ],
      },
      {
        type: "group",
        heading: "Included StoryLine elements",
        items: [
          categoryToggle("includeScenes", "scenes"),
          categoryToggle("includeSceneNotes", "sceneNotes"),
          categoryToggle("includeCharacters", "characters"),
          categoryToggle("includeLocations", "locations"),
        ],
      },
      {
        type: "group",
        heading: "Master file",
        items: [
          this.folderSetting(
            "masterOutputPath",
            "Master output folder",
            "Choose a folder inside this vault. When empty, Master.md is created in the StoryLine project's Canvas folder.",
            "Exports/My Story",
            "Choose the Master output folder",
          ),
          {
            name: "Scene inclusion",
            desc: "Choose whether Master.md contains ordinary scene links or embeds the complete scene notes.",
            control: {
              type: "dropdown",
              key: "masterSceneLinkMode",
              defaultValue: "wikilinks",
              options: {
                wikilinks: "Wikilinks",
                embeds: "Embedded notes",
              },
            },
          },
          {
            name: "Create master file with Canvas files",
            desc: "When enabled, the Canvas command also recreates Master.md. The separate master command always recreates it.",
            control: {
              type: "toggle",
              key: "createMasterWithCanvases",
              defaultValue: true,
            },
          },
        ],
      },
      {
        type: "group",
        heading: "About",
        items: [
          {
            name: "Last update",
            desc: SHOW_LAST_UPDATE_DESCRIPTION,
            render: (setting) => {
              setting.addButton((button) => button
                .setButtonText(SHOW_LAST_UPDATE_LABEL)
                .onClick(() => this.plugin.showLastUpdate()));
            },
          },
          {
            name: "README",
            desc: "Open the complete plugin documentation without leaving Obsidian.",
            render: (setting) => {
              setting.addButton((button) => button
                .setButtonText("Show readme")
                .onClick(() => this.plugin.showReadme()));
            },
          },
        ],
      },
    ];
  }

  getControlValue(key: SettingKey): unknown {
    switch (key) {
      case "projectPath": return this.plugin.settings.projectPath;
      case "includeScenes": return this.plugin.settings.includedCategories.scenes;
      case "includeSceneNotes": return this.plugin.settings.includedCategories.sceneNotes;
      case "includeCharacters": return this.plugin.settings.includedCategories.characters;
      case "includeLocations": return this.plugin.settings.includedCategories.locations;
      case "masterOutputPath": return this.plugin.settings.masterOutputPath;
      case "masterSceneLinkMode": return this.plugin.settings.masterSceneLinkMode;
      case "createMasterWithCanvases": return this.plugin.settings.createMasterWithCanvases;
    }
  }

  async setControlValue(key: SettingKey, value: unknown): Promise<void> {
    switch (key) {
      case "projectPath":
        this.plugin.settings.projectPath = typeof value === "string" ? value : "";
        break;
      case "includeScenes":
        this.plugin.settings.includedCategories.scenes = value === true;
        break;
      case "includeSceneNotes":
        this.plugin.settings.includedCategories.sceneNotes = value === true;
        break;
      case "includeCharacters":
        this.plugin.settings.includedCategories.characters = value === true;
        break;
      case "includeLocations":
        this.plugin.settings.includedCategories.locations = value === true;
        break;
      case "masterOutputPath":
        this.plugin.settings.masterOutputPath = typeof value === "string" ? value : "";
        break;
      case "masterSceneLinkMode":
        this.plugin.settings.masterSceneLinkMode = value === "embeds" ? "embeds" : "wikilinks";
        break;
      case "createMasterWithCanvases":
        this.plugin.settings.createMasterWithCanvases = value === true;
        break;
    }
    await this.plugin.saveSettings();
  }

  private folderSetting(
    key: "projectPath" | "masterOutputPath",
    name: string,
    desc: string,
    placeholder: string,
    chooserPlaceholder: string,
  ): SettingDefinition<SettingKey> {
    return {
      name,
      desc,
      render: (setting) => {
        let textInput: TextComponent | undefined;
        setting.addText((text) => {
          textInput = text;
          text
            .setPlaceholder(placeholder)
            .setValue(this.getControlValue(key) as string)
            .onChange((value) => { void this.setControlValue(key, value); });
        });
        setting.addButton((button) => button
          .setButtonText("Choose")
          .setTooltip(chooserPlaceholder)
          .onClick(() => {
            new VaultFolderSuggestModal(this.app, async (path) => {
              textInput?.setValue(path);
              await this.setControlValue(key, path);
            }, chooserPlaceholder).open();
          }));
      },
    };
  }
}

function categoryToggle(
  key: Extract<SettingKey, `include${string}`>,
  category: keyof typeof CATEGORY_LABELS,
): SettingDefinition<SettingKey> {
  return {
    name: CATEGORY_LABELS[category],
    control: {
      type: "toggle",
      key,
      defaultValue: true,
    },
  };
}
