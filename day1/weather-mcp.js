import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Initialize the server
const server = new Server(
  { name: "weather-server", version: "1.0.0" },
  { capabilities: { tools: {} } },
);

// 1. Tell the AI what tools are available (The Schema Menu)
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_weather",
        description:
          "use this tools to fetch the current weather for a specific city.",
        inputSchema: {
          type: "object",
          properties: {
            city: {
              type: "string",
              description: "the city name (e.g., Mumbai, Tokyo)",
            },
            required: ["city"],
          },
        },
      },
    ],
  };
});

// 2. Define what happens when the AI calls the tool
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "get_weather") {
    const city = request.params.arguments?.city;
    return {
      content: [
        { type: "text", text: `the weather in the ${city} is sunny and 25°C.` },
      ],
    };
  }
  throw new Error("tool not found");
});

// 3. Start the server using standard input/output
const transport = new StdioServerTransport();
await server.connect(transport);
