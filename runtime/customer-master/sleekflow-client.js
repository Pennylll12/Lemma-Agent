const { fetch, ProxyAgent } = require("undici");

const DEFAULT_BASE_URL = "https://api.sleekflow.io";
const MAX_PAGE_SIZE = 1000;

function getSleekFlowConfig(env = process.env) {
  if (!env.SLEEKFLOW_API_KEY) {
    throw new Error("SLEEKFLOW_API_KEY is required");
  }

  return {
    baseUrl: (env.SLEEKFLOW_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, ""),
    apiKey: env.SLEEKFLOW_API_KEY,
    proxyUrl: env.SLEEKFLOW_PROXY_URL || null,
  };
}

function validatePaging({ limit = 50, offset = 0 } = {}) {
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE) {
    throw new RangeError(`limit must be an integer from 1 to ${MAX_PAGE_SIZE}`);
  }
  if (!Number.isInteger(offset) || offset < 0) {
    throw new RangeError("offset must be a non-negative integer");
  }
  return { limit, offset };
}

function createSleekFlowClient({ config = getSleekFlowConfig(), request = fetch } = {}) {
  const dispatcher = config.proxyUrl ? new ProxyAgent(config.proxyUrl) : undefined;

  async function get(path, query = {}) {
    const url = new URL(path, `${config.baseUrl}/`);
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    }

    const response = await request(url, {
      dispatcher,
      headers: {
        Accept: "application/json",
        "X-Sleekflow-Api-Key": config.apiKey,
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      throw new Error(`SleekFlow GET ${url.pathname} failed with HTTP ${response.status}`);
    }
    return response.json();
  }

  return {
    listConversations(paging) {
      return get("/api/conversation/all", validatePaging(paging));
    },
    getConversation(conversationId) {
      if (!conversationId) throw new TypeError("conversationId is required");
      return get(`/api/conversation/${encodeURIComponent(conversationId)}`);
    },
    getConversationMessages(conversationId) {
      if (!conversationId) throw new TypeError("conversationId is required");
      return get(`/api/conversation/message/${encodeURIComponent(conversationId)}`);
    },
    searchConversationMessages(paging) {
      return get("/api/conversation/message/search", validatePaging(paging));
    },
  };
}

module.exports = { MAX_PAGE_SIZE, getSleekFlowConfig, validatePaging, createSleekFlowClient };
