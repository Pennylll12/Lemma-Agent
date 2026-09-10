const {
  readLarkDocumentTool,
} = require("../tools/lark/read-lark-document");

const {
  appendLarkDocumentTool,
} = require("../tools/lark/append-lark-document");

const tools = {
  read_lark_document: readLarkDocumentTool,
  append_lark_document: appendLarkDocumentTool,
};

async function callTool(name, input) {
  const tool = tools[name];

  if (!tool) {
    throw new Error(`Unknown tool: ${name}`);
  }

  return tool(input);
}

module.exports = {
  tools,
  callTool,
};
