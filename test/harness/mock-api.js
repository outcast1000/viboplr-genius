// Minimal mock of the host ViboplrPluginAPI surface used by the Genius plugin.
// Captures registered handlers so tests can assert wiring and invoke them.
function makeMockApi(overrides) {
  overrides = overrides || {};
  const infoHandlers = {};
  const fetchCalls = [];

  const api = {
    infoHandlers,
    fetchCalls,
    log: function () {},
    network: {
      fetch: function (url, init) {
        fetchCalls.push({ url: url, init: init });
        if (overrides.fetch) return overrides.fetch(url, init);
        // Default: a benign empty 200 JSON/text response.
        return Promise.resolve({
          status: 200,
          json: function () { return Promise.resolve({ response: { sections: [] } }); },
          text: function () { return Promise.resolve(""); },
        });
      },
    },
    informationTypes: {
      onFetch: function (id, handler) {
        infoHandlers[id] = handler;
        return function () { delete infoHandlers[id]; };
      },
    },
  };
  return api;
}

module.exports = { makeMockApi };
