#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio";
import { error } from "node:console";
import { z } from "zod";

// ---------------------------------------------------------
// 1. GENERATE MOCK DATA (55 Employees)
// ---------------------------------------------------------
const database = Array.from({ length: 55 }, (_, i) => ({
  id: `emp_${i + 1}`,
  name: `Employee ${i + 1}`,
  department: i % 3 === 0 ? "Engineering" : i % 2 === 0 ? "Sales" : "HR",
}));

// ---------------------------------------------------------
// 2. INITIALIZE SERVER
// ---------------------------------------------------------
const server = new McpServer({
  name: "day9-pagination-server",
  version: "1.0.0",
});

// ---------------------------------------------------------
// 3. THE PAGINATED TOOL
// ---------------------------------------------------------
server.registerTool(
  "list_employees",
  {
    description:
      "fetch a list of company employees. return a paginated list to avoid overwhelming context. use the returned 'next_page' value to fetch more records.",
    inputSchema: {
      page: z
        .number()
        .min(1)
        .default(1)
        .describe("the page number to fetch (starts at 1)"),
      limit: z
        .number()
        .min(1)
        .max(20)
        .default(10)
        .describe("how many records to fetch per page(max 20)"),
    },
  },
  async ({ page, limit }) => {
    //calculate start and end index
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    //slice the data for the current page
    const chunk = database.slice(startIndex, endIndex);

    //determine if there is more data
    const totalRecords = database.length;
    const hasNextPage = endIndex < totalRecords;

    //build the metadata response
    const responsePayload = {
      metadata: {
        current_page: page,
        records_returned: chunk.length,
        total_records: totalRecords,
        next_page: hasNextPage ? page + 1 : null,
        hint: hasNextPage
          ? `call this tool again with page : ${page + 1} to see more`
          : "end of data",
      },
      data: chunk,
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(responsePayload, null, 2),
        },
      ],
    };
  },
);

// ---------------------------------------------------------
// 4. START SERVER
// ---------------------------------------------------------
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("day 9 pagination server is running on stdio");
}

main().catch((error) => {
  console.error("fatal error: ", error);
  process.exit(1);
});

// to run mcp
// npx @modelcontextprotocol/inspector tsx src/index.ts
