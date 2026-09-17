const test = require("node:test");
const assert = require("node:assert/strict");
const { createSleekFlowClient, validatePaging } = require("./sleekflow-client");

function response(body, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

test("list conversations uses the documented route, header, and offset pagination", async () => {
  let observed;
  const client = createSleekFlowClient({
    config: { baseUrl: "https://api.sleekflow.io", apiKey: "test-key", proxyUrl: null },
    request: async (url, options) => {
      observed = { url: String(url), options };
      return response({ data: [] });
    },
  });

  await client.listConversations({ limit: 50, offset: 100 });
  assert.equal(observed.url, "https://api.sleekflow.io/api/conversation/all?limit=50&offset=100");
  assert.equal(observed.options.headers["X-Sleekflow-Api-Key"], "test-key");
});

test("conversation IDs are URL encoded and API failures do not include response data", async () => {
  let url;
  const client = createSleekFlowClient({
    config: { baseUrl: "https://api.sleekflow.io", apiKey: "test-key", proxyUrl: null },
    request: async (target) => {
      url = String(target);
      return response({ sensitive: "do-not-expose" }, 401);
    },
  });

  await assert.rejects(() => client.getConversation("a/b"), /HTTP 401/);
  assert.equal(url, "https://api.sleekflow.io/api/conversation/a%2Fb");
});

test("pagination remains within the official bounds", () => {
  assert.deepEqual(validatePaging(), { limit: 50, offset: 0 });
  assert.throws(() => validatePaging({ limit: 1001 }), RangeError);
  assert.throws(() => validatePaging({ offset: -1 }), RangeError);
});
