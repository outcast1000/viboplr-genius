const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loadPlugin } = require("./harness/sandbox.js");
const { makeMockApi } = require("./harness/mock-api.js");

// The five information types the manifest declares.
const EXPECTED_TYPES = ["song_bio", "song_meaning", "artist_bio", "album_wiki", "lyrics"];

test("activate registers an onFetch handler for every declared info type", () => {
  const plugin = loadPlugin();
  const api = makeMockApi();
  plugin.activate(api);
  for (const id of EXPECTED_TYPES) {
    assert.equal(typeof api.infoHandlers[id], "function", "missing handler: " + id);
  }
});

test("activate does not throw and registers exactly the expected handlers", () => {
  const plugin = loadPlugin();
  const api = makeMockApi();
  assert.doesNotThrow(() => plugin.activate(api));
  assert.deepEqual(Object.keys(api.infoHandlers).sort(), EXPECTED_TYPES.slice().sort());
});

test("a handler returns not_found for a mismatched entity kind without hitting the network", async () => {
  const plugin = loadPlugin();
  const api = makeMockApi();
  plugin.activate(api);
  // song_bio expects a track; an artist entity must short-circuit to not_found.
  const res = await api.infoHandlers.song_bio({ kind: "artist", name: "X" });
  assert.deepEqual(res, { status: "not_found" });
  assert.equal(api.fetchCalls.length, 0, "should not fetch for a mismatched entity");
});

test("a track handler with no artist name resolves to not_found without fetching", async () => {
  const plugin = loadPlugin();
  const api = makeMockApi();
  plugin.activate(api);
  const res = await api.infoHandlers.lyrics({ kind: "track", name: "Song", artistName: "" });
  assert.deepEqual(res, { status: "not_found" });
  assert.equal(api.fetchCalls.length, 0);
});

test("a track handler queries the network and maps an empty search to not_found", async () => {
  const plugin = loadPlugin();
  const api = makeMockApi();
  plugin.activate(api);
  const res = await api.infoHandlers.song_bio({ kind: "track", name: "Song", artistName: "Artist" });
  assert.deepEqual(res, { status: "not_found" });
  assert.ok(api.fetchCalls.length >= 1, "expected a search request");
  assert.match(api.fetchCalls[0].url, /genius\.com\/api\/search/);
});
