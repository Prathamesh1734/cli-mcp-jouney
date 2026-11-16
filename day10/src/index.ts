#!/usr/bin/env node
import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio";

// ---------------------------------------------------------
// 1. MOCK DATA (Imagine these are files on your hard drive)
// ---------------------------------------------------------
const engeeringLogs: Record<string, string> = {
  "2026-11-14": "CRITICAL: Database connection timeout during peak load.",
  "2026-11-15":
    "INFO: Successfully migrated 500 user records to the new cluster.",
  "2026-11-16": "WARN: Memory usage spiked at 95% during the daily backup.",
};

const server = new McpServer({
  name: "day10-resource-template",
  version: "1.0.0",
});

// ---------------------------------------------------------
// 2. REGISTER DYNAMIC RESOURCE TEMPLATE
// ---------------------------------------------------------
server.registerResource(
  "system-logs",
  new ResourceTemplate("log://system/{date}", { list: undefined }),
  { description: "access system logs by specific date (yyyy-mm-dd)" },
  async (uri, variables) => {
    // The SDK automatically extracts the '{date}' parameter into the variables object
    const logDate = variables.date;
    const logContent = engeeringLogs[logDate as string];

    if (!logContent) {
      throw new Error(
        `log bot found for date: ${logDate}. available dates range from 2026-11-14 to 2026-11-16.`,
      );
    }

    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "text/plain",
          text: logContent,
        },
      ],
    };
  },
);

// ---------------------------------------------------------
// 3. START SERVER
// ---------------------------------------------------------
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log("day 10 resource template server is running on stdio");
}

main().catch((err) => {
  console.error("fatal error: ", err);
  process.exit(1);
});

// to test
// npx @modelcontextprotocol/inspector tsx src/index.ts
