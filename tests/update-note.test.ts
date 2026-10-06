import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  CURRENT_UPDATE_ID,
  CURRENT_UPDATE_MARKDOWN,
  CURRENT_UPDATE_VERSION,
  SHOW_LAST_UPDATE_DESCRIPTION,
  SHOW_LAST_UPDATE_LABEL,
} from "../src/update-note-content";

test("keeps the embedded update note synchronized with release metadata", () => {
  const manifest = JSON.parse(fs.readFileSync("manifest.json", "utf8")) as { version: string };
  assert.equal(CURRENT_UPDATE_VERSION, manifest.version);
  assert.equal(CURRENT_UPDATE_ID, `release-${manifest.version}`);
  assert.equal(fs.readFileSync("Last Update.md", "utf8"), `${CURRENT_UPDATE_MARKDOWN}\n`);
  assert.equal(SHOW_LAST_UPDATE_LABEL, "Show last update");
  assert.match(SHOW_LAST_UPDATE_DESCRIPTION, new RegExp(manifest.version.replaceAll(".", "\\.")));
});
