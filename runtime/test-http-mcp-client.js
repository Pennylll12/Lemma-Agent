require("dotenv").config();

const {
  extractWikiToken,
  getWikiNode,
} = require("../integrations/lark/wiki");

async function main() {
  const url = process.argv[2];

  if (!url) {
    throw new Error(
      "Usage: node runtime/test-wiki-node-info.js <LARK_WIKI_URL>"
    );
  }

  const wikiToken = extractWikiToken(url);
  const node = await getWikiNode(wikiToken);

  console.log(JSON.stringify(node, null, 2));
}

main().catch(console.error);