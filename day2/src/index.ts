import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// initialize mcp server
const server = new McpServer({
  name: "updated-mcp-server",
  version: "1.0.0",
});

// register tool - this exposes calculate_sum tool to AI
// ai will read the description and zod schema to understand how to use it

server.registerTool(
  "calculate_sum",
  {
    description: "add two numbers together",
    inputSchema: {
      a: z.number().describe("the first number"),
      b: z.number().describe("the second number"),
    },
  },
  async ({ a, b }) => {
    let res = a + b;
    // tool must return an object with "content" array
    return {
      content: [
        {
          type: "text",
          text: `the sum of ${a} and ${b} is ${res}`,
        },
      ],
    };
  },
);

server.registerTool(
  "calculate_difference",
  {
    description: "subtract the second number from first number",
    inputSchema: {
      a: z.number().describe("starting number"),
      b: z.number().describe("number to subtract"),
    },
  },
  async ({ a, b }) => {
    return {
      content: [
        {
          type: "text",
          text: `the difference is ${a - b}`,
        },
      ],
    };
  },
);

server.registerTool(
  "format_text",
  {
    description: "convert a string to completely uppercase or lowercase",
    inputSchema: {
      text: z.string().describe("the text to modify"),
      format: z.enum(["upper", "lower"]).describe("the case format to apply"),
    },
  },
  async ({ text, format }) => {
    const result = format === "upper" ? text.toUpperCase() : text.toLowerCase();

    return {
      content: [
        {
          type: "text",
          text: `formatted text: ${result}`,
        },
      ],
    };
  },
);

server.registerTool(
  "calculate_multiplication",
  {
    description: "multiplies two numbers",
    inputSchema: {
      a: z.number().describe("the first number"),
      b: z.number().describe("the second number"),
    },
  },
  async ({ a, b }) => {
    let result = a * b;
    return {
      content: [
        {
          type: "text",
          text: `the multiplication of ${a} and ${b} is ${result}`,
        },
      ],
    };
  },
);

// start the server and connect the transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("mcp server is running on stdio");
}

main().catch((err) => {
  console.error("fatal error: ", err);
  process.exit(1);
});

// Important Note on Logging: When using stdio transport, the AI host communicates with your server by reading stdout. If you use console.log(), it will corrupt the JSON-RPC messages and crash the connection. Always use console.error() for debugging and logging, as stderr is ignored by the MCP protocol.

// test with mcp inspector
// npx @modelcontextprotocol/inspector tsx src/index.ts
