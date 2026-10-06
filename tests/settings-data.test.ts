import assert from "node:assert/strict";
import test from "node:test";
import { normalizeSettings } from "../src/settings-data";

test("normalizes project paths and migrates missing category flags", () => {
  assert.deepEqual(normalizeSettings({
    projectPath: "/Romane//Projekt M/",
    includedCategories: { scenes: false },
  }), {
    projectPath: "Romane/Projekt M",
    masterOutputPath: "",
    createMasterWithCanvases: true,
    masterSceneLinkMode: "wikilinks",
    includedCategories: { scenes: false, sceneNotes: true, characters: true, locations: true },
  });
});

test("preserves the master-file switch", () => {
  assert.equal(normalizeSettings({ createMasterWithCanvases: false }).createMasterWithCanvases, false);
});

test("normalizes the Master scene inclusion mode", () => {
  assert.equal(normalizeSettings({ masterSceneLinkMode: "embeds" }).masterSceneLinkMode, "embeds");
  assert.equal(normalizeSettings({ masterSceneLinkMode: "invalid" }).masterSceneLinkMode, "wikilinks");
});

test("normalizes the separate Master output folder", () => {
  assert.equal(
    normalizeSettings({ masterOutputPath: "/Exports//Projekt M/" }).masterOutputPath,
    "Exports/Projekt M",
  );
});
