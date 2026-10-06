import { FuzzySuggestModal, TFolder, type App } from "obsidian";

export class VaultFolderSuggestModal extends FuzzySuggestModal<TFolder> {
  constructor(
    app: App,
    private readonly onChoose: (path: string) => Promise<void> | void,
    placeholder = "Choose a vault folder",
  ) {
    super(app);
    this.setPlaceholder(placeholder);
  }

  getItems(): TFolder[] {
    return this.app.vault
      .getAllLoadedFiles()
      .filter((file): file is TFolder => file instanceof TFolder && file.path !== "/")
      .sort((left, right) => left.path.localeCompare(right.path, "en"));
  }

  getItemText(folder: TFolder): string {
    return folder.path;
  }

  onChooseItem(folder: TFolder): void {
    void this.onChoose(folder.path);
  }
}
