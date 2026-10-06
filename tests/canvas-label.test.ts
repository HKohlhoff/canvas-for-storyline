import assert from "node:assert/strict";
import test from "node:test";
import { visibleCanvasLabel } from "../src/ui/canvas-label";

test("removes project prefixes and the Canvas extension from generated headings", () => {
  assert.equal(
    visibleCanvasLabel("Projekt M - Kapitel 1 - Leerheit.canvas"),
    "Kapitel 1 - Leerheit",
  );
  assert.equal(visibleCanvasLabel("Projekt M - Übersicht.canvas"), "Übersicht");
  assert.equal(visibleCanvasLabel("Andere Datei.canvas"), "Andere Datei");
});
