// Failure reasons: an `error` result must say why, or the host can only show
// "Genius couldn't answer" with nothing for the user to act on.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loadPlugin } = require("./harness/sandbox.js");
const { makeMockApi } = require("./harness/mock-api.js");

function response(status, headers, body) {
  return Promise.resolve({
    status: status,
    headers: headers || {},
    json: function () { return Promise.resolve(body || {}); },
    text: function () { return Promise.resolve(""); },
  });
}

function failingFetch(status, headers) {
  return function () { return response(status, headers); };
}

// A search that finds the song, then `page` for every other request.
function searchHitThen(page) {
  return function (url) {
    if (/api\/search/.test(url)) {
      return response(200, {}, { response: { sections: [{ hits: [{ type: "song", result: {
        id: 1, url: "https://genius.com/Queen-bohemian-rhapsody-lyrics", artist_names: "Queen",
      } }] }] } });
    }
    return page(url);
  };
}

const TRACK = { kind: "track", name: "Bohemian Rhapsody", artistName: "Queen" };
const ENTITIES = {
  song_bio: TRACK,
  song_meaning: TRACK,
  lyrics: TRACK,
  artist_bio: { kind: "artist", name: "Queen" },
  album_wiki: { kind: "album", name: "A Night at the Opera", artistName: "Queen" },
};

test("a Cloudflare bot check is reported as a blocked network, on every info type", async () => {
  const plugin = loadPlugin();
  const api = makeMockApi({ fetch: failingFetch(403, { "cf-mitigated": "challenge", server: "cloudflare" }) });
  plugin.activate(api);
  for (const [id, entity] of Object.entries(ENTITIES)) {
    const res = await api.infoHandlers[id](entity);
    assert.equal(res.status, "error", id);
    assert.match(res.message, /blocking requests from this network/, id);
    assert.match(res.message, /Cloudflare bot check, HTTP 403/, id);
  }
});

test("a plain 403 without Cloudflare's marks is not blamed on Cloudflare", async () => {
  const plugin = loadPlugin();
  const api = makeMockApi({ fetch: failingFetch(403, { server: "nginx" }) });
  plugin.activate(api);
  const res = await api.infoHandlers.song_bio(TRACK);
  assert.equal(res.status, "error");
  assert.doesNotMatch(res.message, /Cloudflare/);
  assert.match(res.message, /refused the request \(HTTP 403\)/);
});

test("rate limiting and server errors say so", async () => {
  for (const [status, pattern] of [[429, /rate limiting/], [503, /having trouble \(HTTP 503\)/]]) {
    const plugin = loadPlugin();
    const api = makeMockApi({ fetch: failingFetch(status) });
    plugin.activate(api);
    const res = await api.infoHandlers.lyrics(TRACK);
    assert.equal(res.status, "error");
    assert.match(res.message, pattern);
  }
});

test("a network failure keeps its own message", async () => {
  const plugin = loadPlugin();
  const api = makeMockApi({ fetch: () => Promise.reject(new Error("tls handshake eof")) });
  plugin.activate(api);
  const res = await api.infoHandlers.artist_bio(ENTITIES.artist_bio);
  assert.deepEqual(res, { status: "error", message: "tls handshake eof" });
});

test("a blocked lyrics page is an error, not 'no lyrics'", async () => {
  const plugin = loadPlugin();
  const api = makeMockApi({ fetch: searchHitThen(failingFetch(403, { "cf-mitigated": "challenge" })) });
  plugin.activate(api);
  const res = await api.infoHandlers.lyrics(TRACK);
  assert.equal(res.status, "error");
  assert.match(res.message, /Cloudflare/);
});

test("a missing lyrics page (404) is still not_found", async () => {
  const plugin = loadPlugin();
  const api = makeMockApi({ fetch: searchHitThen(failingFetch(404)) });
  plugin.activate(api);
  assert.deepEqual(await api.infoHandlers.lyrics(TRACK), { status: "not_found" });
});
