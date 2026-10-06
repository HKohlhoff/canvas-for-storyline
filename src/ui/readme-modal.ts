import { App, Component, MarkdownRenderer, Modal } from "obsidian";
import README_MARKDOWN from "../../README.md";
import { prepareReadmeMarkdown } from "./readme-content";

const REPOSITORY_URL = "https://github.com/HKohlhoff/canvas-for-storyline";

class ReadmeModal extends Modal {
  private readonly renderComponent = new Component();

  onOpen(): void {
    this.setTitle("Canvas for StoryLine: README");
    this.modalEl.addClass("canvas-for-storyline-documentation-modal");
    this.renderComponent.load();
    const markdownElement = this.contentEl.createDiv({ cls: "markdown-rendered" });
    const markdown = prepareReadmeMarkdown(README_MARKDOWN, REPOSITORY_URL);
    void MarkdownRenderer.render(
      this.app,
      markdown,
      markdownElement,
      "",
      this.renderComponent,
    ).catch((error: unknown) => {
      console.error("[Canvas for StoryLine] Could not render README", error);
      markdownElement.setText(markdown);
    });
    addCloseButton(this.contentEl, () => this.close());
  }

  onClose(): void {
    this.renderComponent.unload();
    this.contentEl.empty();
  }
}

export function openPluginReadme(app: App): void {
  new ReadmeModal(app).open();
}

export function addCloseButton(container: HTMLElement, close: () => void): void {
  const actions = container.createDiv({ cls: "canvas-for-storyline-documentation-actions" });
  const closeButton = actions.createEl("button", { cls: "mod-cta", text: "Close" });
  closeButton.addEventListener("click", close);
}
