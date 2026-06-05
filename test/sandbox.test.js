const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loadPlugin } = require("./harness/sandbox.js");

test("loadPlugin returns the plugin object with an activate function", () => {
  const plugin = loadPlugin();
  assert.equal(typeof plugin.activate, "function");
});

test("each loadPlugin call returns a fresh instance (no shared state)", () => {
  const a = loadPlugin();
  const b = loadPlugin();
  assert.notEqual(a, b);
  assert.notEqual(a.activate, b.activate);
});

test("index.js does not reference forbidden globals at load time", () => {
  assert.doesNotThrow(() => loadPlugin());
});
