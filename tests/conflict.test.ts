import assert from "node:assert/strict";
import test from "node:test";
import { contentHash } from "../src/generation/identity";
import { decideExistingArtifactAction, processOwnedArtifact } from "../src/vault/conflict";

test("unowned output is protected", () => {
  assert.equal(decideExistingArtifactAction(undefined, "existing", "generated"), "conflict");
});

test("manually changed generated output is protected", () => {
  assert.equal(decideExistingArtifactAction(contentHash("old generated"), "manual change", "new generated"), "conflict");
});

test("owned unchanged output can be updated or left alone", () => {
  const priorHash = contentHash("old generated");
  assert.equal(decideExistingArtifactAction(priorHash, "old generated", "new generated"), "update");
  assert.equal(decideExistingArtifactAction(priorHash, "old generated", "old generated"), "unchanged");
});

test("atomically checks the content supplied by Vault.process before updating", async () => {
  let stored = "manual change after an earlier read";
  const action = await processOwnedArtifact(
    async (transform) => {
      stored = transform(stored);
      return stored;
    },
    contentHash("old generated"),
    "new generated",
  );
  assert.equal(action, "conflict");
  assert.equal(stored, "manual change after an earlier read");
});

test("atomically replaces content that still has its owned hash", async () => {
  let stored = "old generated";
  const action = await processOwnedArtifact(
    async (transform) => {
      stored = transform(stored);
      return stored;
    },
    contentHash("old generated"),
    "new generated",
  );
  assert.equal(action, "update");
  assert.equal(stored, "new generated");
});
