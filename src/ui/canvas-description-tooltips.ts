import { TFile, TFolder, type App, type Plugin } from "obsidian";
import type { GenerationPlan } from "../generation/plan/types";
import { visibleCanvasLabel } from "./canvas-label";
import { overviewTooltipDescriptions } from "./canvas-tooltip-data";

export class CanvasDescriptionTooltipController {
  private descriptions = new Map<string, string>();
  private decorationFrame: number | null = null;
  private tooltipElement: HTMLElement | null = null;
  private readonly hoverListeners = new Map<HTMLElement, {
    enter: (event: MouseEvent) => void;
    leave: () => void;
    move: (event: MouseEvent) => void;
    press: () => void;
  }>();

  constructor(
    private readonly app: App,
    private readonly plugin: Plugin,
  ) {}

  start(): void {
    const observer = new MutationObserver(() => this.scheduleDecoration());
    observer.observe(document.body, { childList: true, subtree: true });
    this.plugin.registerEvent(this.app.workspace.on("layout-change", () => {
      this.hideTooltip();
      this.scheduleDecoration();
    }));
    this.plugin.registerEvent(this.app.workspace.on("active-leaf-change", () => {
      this.hideTooltip();
      this.scheduleDecoration();
    }));
    this.plugin.register(() => observer.disconnect());
    this.plugin.register(() => {
      if (this.decorationFrame !== null) window.cancelAnimationFrame(this.decorationFrame);
      this.removeHoverListeners();
      this.tooltipElement?.remove();
      this.tooltipElement = null;
    });
    this.scheduleDecoration();
  }

  async refreshFromVault(projectPath: string): Promise<void> {
    this.hideTooltip();
    this.descriptions.clear();
    if (!projectPath) return;
    const folder = this.app.vault.getAbstractFileByPath(`${projectPath}/Canvas`);
    if (!(folder instanceof TFolder)) return;
    for (const child of folder.children) {
      if (!(child instanceof TFile) || child.extension.toLowerCase() !== "canvas") continue;
      try {
        this.addDescriptions(await this.app.vault.cachedRead(child));
      } catch (error) {
        console.warn(`Canvas for StoryLine could not read tooltip data from ${child.path}`, error);
      }
    }
    this.scheduleDecoration();
  }

  refreshFromPlan(plan: GenerationPlan): void {
    this.hideTooltip();
    this.descriptions.clear();
    for (const artifact of plan.artifacts) {
      if (artifact.path.toLowerCase().endsWith(".canvas")) {
        this.addDescriptions(artifact.content);
      }
    }
    this.scheduleDecoration();
  }

  private scheduleDecoration(): void {
    if (this.decorationFrame !== null) return;
    this.decorationFrame = window.requestAnimationFrame(() => {
      this.decorationFrame = null;
      this.decorateCards();
    });
  }

  private addDescriptions(content: string): void {
    for (const [nodeId, description] of overviewTooltipDescriptions(content)) {
      this.descriptions.set(nodeId, description);
    }
  }

  private decorateCards(): void {
    for (const nodeElement of this.hoverListeners.keys()) {
      if (!nodeElement.isConnected) this.removeHoverListener(nodeElement);
    }
    for (const leaf of this.app.workspace.getLeavesOfType("canvas")) {
      const view = leaf.view as unknown;
      if (!isRecord(view) || !isRecord(view.canvas)) continue;
      const runtimeNodes = iterableValues(view.canvas.nodes);
      if (!runtimeNodes) continue;
      for (const runtimeNode of runtimeNodes) {
        if (!isRecord(runtimeNode) || typeof runtimeNode.id !== "string") continue;
        if (!runtimeNode.id.startsWith("cfs-card-")) continue;
        const nodeElement = runtimeNode.nodeEl instanceof HTMLElement ? runtimeNode.nodeEl : null;
        const labelElement = runtimeNode.labelEl instanceof HTMLElement ? runtimeNode.labelEl : null;
        this.decorateCard(runtimeNode.id, nodeElement, labelElement);
      }
    }

    // Fallback for Obsidian versions that expose card metadata only in the DOM.
    for (const node of document.querySelectorAll<HTMLElement>(
      '.canvas-node[data-node-id^="cfs-card-"]',
    )) {
      const label = node.querySelector<HTMLElement>(".canvas-node-label");
      this.decorateCard(node.dataset.nodeId ?? "", node, label);
    }
  }

  private decorateCard(
    nodeId: string,
    nodeElement: HTMLElement | null,
    labelElement: HTMLElement | null,
  ): void {
    if (labelElement?.textContent) {
      labelElement.textContent = visibleCanvasLabel(labelElement.textContent);
    }
    if (!nodeElement) return;
    const description = this.descriptions.get(nodeId);
    if (description) {
      nodeElement.dataset.cfsDescription = description;
      this.addHoverListeners(nodeElement);
    } else {
      delete nodeElement.dataset.cfsDescription;
      this.removeHoverListener(nodeElement);
    }
  }

  private addHoverListeners(nodeElement: HTMLElement): void {
    if (this.hoverListeners.has(nodeElement)) return;
    const enter = (event: MouseEvent): void => this.showTooltip(nodeElement, event);
    const move = (event: MouseEvent): void => this.positionTooltip(event);
    const leave = (): void => this.hideTooltip();
    const press = (): void => this.hideTooltip();
    nodeElement.addEventListener("mouseenter", enter);
    nodeElement.addEventListener("mousemove", move);
    nodeElement.addEventListener("mouseleave", leave);
    nodeElement.addEventListener("mousedown", press);
    this.hoverListeners.set(nodeElement, { enter, leave, move, press });
  }

  private removeHoverListener(nodeElement: HTMLElement): void {
    const listeners = this.hoverListeners.get(nodeElement);
    if (!listeners) return;
    nodeElement.removeEventListener("mouseenter", listeners.enter);
    nodeElement.removeEventListener("mousemove", listeners.move);
    nodeElement.removeEventListener("mouseleave", listeners.leave);
    nodeElement.removeEventListener("mousedown", listeners.press);
    this.hoverListeners.delete(nodeElement);
  }

  private removeHoverListeners(): void {
    for (const nodeElement of this.hoverListeners.keys()) this.removeHoverListener(nodeElement);
  }

  private showTooltip(nodeElement: HTMLElement, event: MouseEvent): void {
    const description = nodeElement.dataset.cfsDescription;
    if (!description) return;
    const tooltip = this.getTooltipElement();
    tooltip.textContent = description;
    tooltip.classList.add("is-visible");
    this.positionTooltip(event);
  }

  private hideTooltip(): void {
    this.tooltipElement?.classList.remove("is-visible");
  }

  private getTooltipElement(): HTMLElement {
    if (this.tooltipElement) return this.tooltipElement;
    const tooltip = document.body.createDiv({ cls: "cfs-description-tooltip" });
    tooltip.setAttribute("role", "tooltip");
    this.tooltipElement = tooltip;
    return tooltip;
  }

  private positionTooltip(event: MouseEvent): void {
    const tooltip = this.tooltipElement;
    if (!tooltip?.classList.contains("is-visible")) return;
    const margin = 12;
    const pointerOffset = 16;
    const bounds = tooltip.getBoundingClientRect();
    const left = Math.max(margin, Math.min(
      event.clientX + pointerOffset,
      window.innerWidth - bounds.width - margin,
    ));
    const top = Math.max(margin, Math.min(
      event.clientY + pointerOffset,
      window.innerHeight - bounds.height - margin,
    ));
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function iterableValues(value: unknown): Iterable<unknown> | null {
  if (!isRecord(value) || typeof value.values !== "function") return null;
  try {
    const values = value.values.call(value) as unknown;
    return isRecord(values) && Symbol.iterator in values
      ? values as unknown as Iterable<unknown>
      : null;
  } catch {
    return null;
  }
}
