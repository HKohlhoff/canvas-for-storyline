import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { prepareReadmeMarkdown } from "../src/ui/readme-content";

test("prepares embedded README content without automatic image requests", () => {
  const prepared = prepareReadmeMarkdown([
    "![Local screenshot](images/example.png)",
    '<a href="https://example.com"><img src="https://example.com/image.png" alt="Remote"></a>',
    '<a href="https://ko-fi.com/example"><img src="https://storage.ko-fi.com/button.png" alt="Coffee"></a>',
    "[Local document](docs/guide.md)",
    "[External](https://obsidian.md)",
  ].join("\n"), "https://github.com/example/plugin/");

  assert.doesNotMatch(prepared, /<img|!\[/u);
  assert.doesNotMatch(prepared, /Image omitted|Local screenshot|Remote|Coffee/u);
  assert.match(prepared, /\[Support this plugin on Ko-fi\]\(https:\/\/ko-fi\.com\/example\)/u);
  assert.match(prepared, /github\.com\/example\/plugin\/blob\/master\/docs\/guide\.md/u);
  assert.match(prepared, /\[External\]\(https:\/\/obsidian\.md\)/u);
});

test("keeps the actual README suitable for the embedded documentation view", () => {
  const prepared = prepareReadmeMarkdown(
    readFileSync("README.md", "utf8"),
    "https://github.com/HKohlhoff/canvas-for-storyline",
  );
  assert.doesNotMatch(prepared, /<img|!\[|Image omitted|\n{3,}/u);
  assert.match(prepared, /^# Canvas for StoryLine$/mu);
  assert.match(prepared, /Show last update/u);
});
