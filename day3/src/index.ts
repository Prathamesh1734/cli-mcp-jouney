import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "day3-context-server",
  version: "1.0.0",
});

// 1. register a resource so ai can read this data
server.registerResource(
  "app-config",
  "config://local/app-settings",
  {
    description: "read only application configuration and feature flags",
  },
  async (uri) => {
    // in real app this might read json file or query database
    const fakeConfigData = {
      theme: "dark",
      features: { newUI: true, betaTesting: false },
      maxRetries: 3,
    };

    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(fakeConfigData, null, 2),
        },
      ],
    };
  },
);

// 2. register a prompt
server.registerPrompt(
  "review_code",
  {
    description: "review a code snippet against company guidelines",
    argsSchema: {
      code: z.string().describe("the code snippet to review"),
    },
  },
  ({ code }) => {
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `please review the following code.
                
                CRITICAL RULES:
                1. all functions must have Typescript return types
                2. do not console.log() in production
                
                here is the code:
                ${code}`,
          },
        },
      ],
    };
  },
);

// 3. start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("server is running with resources and prompts");
}

main().catch((err) => {
  console.error("fatal error: " + err);
  process.exit(1);
});


// run npx @modelcontextprotocol/inspector tsx src/index.ts
