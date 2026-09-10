require("dotenv").config();

const {
  Client,
} = require("@modelcontextprotocol/sdk/client/index.js");

const {
  StreamableHTTPClientTransport,
} = require("@modelcontextprotocol/sdk/client/streamableHttp.js");

async function main() {
  const mcpUrl = process.env.MCP_SERVER_URL;

  if (!mcpUrl) {
    throw new Error(
      "Missing MCP_SERVER_URL in .env"
    );
  }

  const transport =
    new StreamableHTTPClientTransport(
      new URL(mcpUrl)
    );

  const client = new Client({
    name: "supermama-http-test-client",
    version: "0.2.0",
  });

  await client.connect(transport);

  const tools = await client.listTools();

  console.log(
    "Available tools:",
    tools.tools.map((t) => t.name)
  );

  const result = await client.callTool({
    name: "read_lark_document",
    arguments: {
      url:
        "https://ysgjyjx6z20y.sg.larksuite.com/wiki/UvMrwd23Ti4BW3k6oHslXcABgec",
    },
  });

  console.log(
    JSON.stringify(result, null, 2)
  );

  await client.close();
}

main().catch(console.error);