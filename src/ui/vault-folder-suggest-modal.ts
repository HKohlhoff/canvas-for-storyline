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
    return collectFolders(this.app.vault.getRoot())
      .sort((left, right) => left.path.localeCompare(right.path, "en"));
  }

  getItemText(folder: TFolder): string {
    return folder.path;
  }

  onChooseItem(folder: TFolder): void {
    void this.onChoose(folder.path);
  }
}

function collectFolders(parent: TFolder): TFolder[] {
  const folders: TFolder[] = [];
  for (const child of parent.children) {
    if (!(child instanceof TFolder)) continue;
    folders.push(child, ...collectFolders(child));
  }
  return folders;
}
