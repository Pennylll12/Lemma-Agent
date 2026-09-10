require("dotenv").config();

const express = require("express");

const {
  McpServer,
} = require("@modelcontextprotocol/sdk/server/mcp.js");

const {
  StreamableHTTPServerTransport,
} = require("@modelcontextprotocol/sdk/server/streamableHttp.js");

const { z } = require("zod");

const {
  readLarkDocumentTool,
} = require("../tools/lark/read-lark-document");


const app = express();

app.use(express.json());


function createMcpServer() {

  const server = new McpServer({
    name: "supermama-lark",
    version: "0.2.0",
  });


  server.registerTool(
    "read_lark_document",
    {
      title: "Read Lark Document",
      description:
        "Read content from a Lark Wiki document.",
      inputSchema: {
        url: z.string().url(),
      },
    },

    async ({ url }) => {

      const result =
        await readLarkDocumentTool({
          url,
        });


      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result),
          },
        ],
      };
    }
  );


  return server;
}


app.post("/mcp", async (req, res) => {

  const server = createMcpServer();


  const transport =
    new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });


  await server.connect(transport);


  await transport.handleRequest(
    req,
    res,
    req.body
  );

});


app.get("/health", (req,res)=>{
  res.json({
    status:"ok",
    service:"supermama-lark-mcp",
    version:"0.2.0"
  });
});


const PORT =
  process.env.PORT || 3000;


app.listen(PORT, ()=>{

  console.log(
    `Supermama Lark MCP HTTP Server running on ${PORT}`
  );

});
