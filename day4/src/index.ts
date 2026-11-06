import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { process } from "zod/v4/core";

const server = new McpServer({
  name: "day4-error-handling",
  version: "1.0.0",
});

// a mock database to simulate data fetching
const mockDatabase = {
  user_123: { name: "alice", role: "Admin" },
  user_456: { name: "bob", role: "Developer" },
};

server.registerTool(
  "get_user_profile",
  {
    description: "fetch a user profile by their ID",
    inputSchema: {
      userId: z
        .string()
        .describe("the user ID to look up (must start with 'user_')"),
    },
  },
  async ({ userId }) => {
    try {
      // ---------------------------------------------------------
      // ERROR CASE 1: Bad Input (LLM hallucinated a bad format)
      // ---------------------------------------------------------
      if (!userId.startsWith("user_")) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `error: invalid ID format. you provided ${userId}. all valid user id must start with 'user_'. please correct it and try again.`,
            },
          ],
        };
      }

      // ---------------------------------------------------------
      // ERROR CASE 2: Not Found (Valid format, but no data)
      // ---------------------------------------------------------
      const user = mockDatabase[userId as keyof typeof mockDatabase];
      if (!user) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `error: no user found in the database matching ID '${userId}'`,
            },
          ],
        };
      }

      // ---------------------------------------------------------
      // SUCCESS CASE
      // ---------------------------------------------------------

      return {
        content: [
          {
            type: "text",
            text: `successfully retrieved profile for ${userId}: ${user.name} is a ${user.role}`,
          },
        ],
      };
    } catch (error) {
      // ---------------------------------------------------------
      // ERROR CASE 3: Unexpected System Crash (Network, File, etc)
      // ---------------------------------------------------------
      // Catching this prevents the entire stdio server from dying
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `system failure: an unexpected error occurred - ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("day 4 server running: ready to handle errors gracefully");
}

main().catch((err) => {
  console.error("fatal error: ", err);
  process.exit(1);
});
