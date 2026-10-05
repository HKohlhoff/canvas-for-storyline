import assert from "node:assert/strict";
import test from "node:test";
import { GenerationRunGuard } from "../src/generation/run-guard";

test("rejects a parallel generation and accepts a later run", async () => {
  const guard = new GenerationRunGuard();
  let releaseFirst: (() => void) | undefined;
  let taskCalls = 0;
  const first = guard.run(async () => {
    taskCalls += 1;
    await new Promise<void>((resolve) => { releaseFirst = resolve; });
  });

  const parallel = await guard.run(async () => { taskCalls += 1; });
  assert.equal(parallel, false);
  assert.equal(taskCalls, 1);

  releaseFirst?.();
  assert.equal(await first, true);
  assert.equal(await guard.run(async () => { taskCalls += 1; }), true);
  assert.equal(taskCalls, 2);
});

test("releases the guard after a failed generation", async () => {
  const guard = new GenerationRunGuard();
  await assert.rejects(guard.run(async () => { throw new Error("generation failed"); }));
  assert.equal(await guard.run(async () => {}), true);
});
