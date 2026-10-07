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

test("keeps the 0.8.1 update note unchanged for maintenance releases", () => {
  assert.equal(CURRENT_UPDATE_VERSION, "0.8.1");
  assert.equal(CURRENT_UPDATE_ID, "release-0.8.1");
  assert.equal(fs.readFileSync("Last Update.md", "utf8"), `${CURRENT_UPDATE_MARKDOWN}\n`);
  assert.equal(SHOW_LAST_UPDATE_LABEL, "Show last update");
  assert.match(SHOW_LAST_UPDATE_DESCRIPTION, /0\.8\.1/);
});
