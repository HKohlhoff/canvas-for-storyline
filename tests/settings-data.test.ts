import assert from "node:assert/strict";
import test from "node:test";
import { normalizeSettings } from "../src/settings-data";

test("normalizes project paths and migrates missing category flags", () => {
  assert.deepEqual(normalizeSettings({
    projectPath: "/Romane//Projekt M/",
    includedCategories: { scenes: false },
  }), {
    projectPath: "Romane/Projekt M",
    includedCategories: { scenes: false, sceneNotes: true, characters: true, locations: true },
  });
});
