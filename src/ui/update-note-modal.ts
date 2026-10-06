import { Component, MarkdownRenderer, Modal, type App } from "obsidian";
import { CURRENT_UPDATE_MARKDOWN } from "../update-note-content";
import { addCloseButton } from "./readme-modal";

export class UpdateNoteModal extends Modal {
  private readonly renderComponent = new Component();
  private resolved = false;

  constructor(
    app: App,
    private readonly afterClose: () => void,
  ) {
    super(app);
  }

  onOpen(): void {
    this.setTitle("Canvas for StoryLine: What's new");
    this.modalEl.addClass("canvas-for-storyline-documentation-modal");
    this.contentEl.empty();
    this.renderComponent.load();
    const markdownElement = this.contentEl.createDiv({ cls: "markdown-rendered" });
    void MarkdownRenderer.render(
      this.app,
      CURRENT_UPDATE_MARKDOWN,
      markdownElement,
      "",
      this.renderComponent,
    ).catch((error: unknown) => {
      console.error("[Canvas for StoryLine] Could not render update note", error);
      markdownElement.setText(CURRENT_UPDATE_MARKDOWN);
    });
    addCloseButton(this.contentEl, () => this.close());
  }

  onClose(): void {
    this.renderComponent.unload();
    this.contentEl.empty();
    if (this.resolved) return;
    this.resolved = true;
    this.afterClose();
  }
}
