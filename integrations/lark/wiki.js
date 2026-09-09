const { getTenantAccessToken } = require("./auth");

function extractWikiToken(url) {
  const match = url.match(/\/wiki\/([^/?#]+)/);

  if (!match) {
    throw new Error("Invalid Lark Wiki URL");
  }

  return match[1];
}

async function getWikiNode(wikiToken) {
  const accessToken = await getTenantAccessToken();

  const response = await fetch(
    `https://open.larksuite.com/open-apis/wiki/v2/spaces/get_node?token=${encodeURIComponent(
      wikiToken
    )}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok || data.code !== 0) {
    throw new Error(`Get Wiki node failed: ${JSON.stringify(data)}`);
  }

  return data.data.node;
}

module.exports = {
  extractWikiToken,
  getWikiNode,
};