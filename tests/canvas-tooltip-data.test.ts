import assert from "node:assert/strict";
import test from "node:test";
import { overviewTooltipDescriptions } from "../src/ui/canvas-tooltip-data";

test("keeps quick information only for overview cards that link to Canvas files", () => {
  const descriptions = overviewTooltipDescriptions(JSON.stringify({
    nodes: [
      {
        id: "chapter",
        type: "file",
        file: "Project/Canvas/Project - Kapitel 1.canvas",
        cfsDescription: "Kapitelbeschreibung",
      },
      {
        id: "scene",
        type: "file",
        file: "Project/Scenes/Scene.md",
        cfsDescription: "Szenenbeschreibung",
      },
    ],
  }));

  assert.deepEqual([...descriptions], [["chapter", "Kapitelbeschreibung"]]);
});
