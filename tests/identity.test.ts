import assert from "node:assert/strict";
import test from "node:test";
import { contentHash, stableId } from "../src/generation/identity";

test("stable IDs are deterministic and distinguish inputs", () => {
  assert.equal(stableId("scene", "A"), stableId("scene", "A"));
  assert.notEqual(stableId("scene", "A"), stableId("scene", "B"));
  assert.match(stableId("scene", "A"), /^[a-f0-9]{16}$/);
});

test("content hashes change with the complete generated content", () => {
  assert.equal(contentHash("alpha"), contentHash("alpha"));
  assert.notEqual(contentHash("alpha"), contentHash("alpha\n"));
});
