import assert from "node:assert/strict";
import test from "node:test";
import { normalizePluginData } from "../src/plugin-data";

test("migrates plugin data without an update-note marker", () => {
  assert.equal(normalizePluginData({}).ui.lastShownUpdateId, "");
});

test("preserves a normalized update-note marker", () => {
  assert.equal(
    normalizePluginData({ ui: { lastShownUpdateId: " release-0.8.0 " } }).ui.lastShownUpdateId,
    "release-0.8.0",
  );
});
