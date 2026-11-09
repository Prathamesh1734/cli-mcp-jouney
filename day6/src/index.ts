#!/user/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ---------------------------------------------------------
// 1. ENVIRONMENT VALIDATION (Fail Fast)
// ---------------------------------------------------------
// We check this immediately. If the key is missing, we stop execution
// before the CLI or the AI even tries to use it.
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!GITHUB_TOKEN) {
  console.error("❌ critical error: GITHUB_TOKEN env variable is missing");
  console.error("please provide it when running the command");
  process.exit(1);
}

// ---------------------------------------------------------
// 2. AUTHENTICATED BUSINESS LOGIC
// ---------------------------------------------------------
async function fetchPrivateProfile() {
  // this endpoint required authentication
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Day6-MCP-CLI",
    },
  });

  if (!response.ok) {
    throw new Error(
      `github api fetch error: ${response.status} - ${response.statusText}`,
    );
  }

  const data = await response.json();

  return {
    username: data.login,
    name: data.name,
    private_repos: data.total_private_repos,
    plan: data.plan?.name || "free",
  };
}

// ---------------------------------------------------------
// 3. ROUTER
// ---------------------------------------------------------
const args = process.argv.slice(2);

if (args.includes("--mcp")) {
  runMcpServer();
} else {
  runCli();
}

// ---------------------------------------------------------
// 4. HUMAN MODE: CLI Interface
// ---------------------------------------------------------
async function runCli() {
  console.log("\n🔒 authticating with github...\n");
  try {
    const profile = await fetchPrivateProfile();
    console.table([profile]);
  } catch (error) {
    console.error(
      "❌ failed: ",
      error instanceof Error ? error.message : error,
    );
  }
}

// ---------------------------------------------------------
// 5. AI MODE: MCP Server Interface
// ---------------------------------------------------------
async function runMcpServer() {
  const server = new McpServer({
    name: "github-private-mcp",
    version: "1.0.0",
  });

  server.registerTool(
    "get_my_private_profile",
    {
      description:
        "fetch the authenticated user's private github profile details",
      inputSchema: {},
    },
    async () => {
      try {
        const profile = await fetchPrivateProfile();
        return {
          content: [
            {
              type: "text",
              text: `authticated profile data:\n\n${JSON.stringify(profile, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `auth failed: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    },
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("day 6 authenticated server running on stdio");
}

// to test cli without key
// npx tsx src/index.ts

// to test cli with key (bash)
// GITHUB_TOKEN="ghp_fake_token_123" npx tsx src/day6.ts
// powershell
// $env:GITHUB_TOKEN="ghp_fake_token_123"; npx tsx src/day6.ts

// test mcp inspector
// GITHUB_TOKEN="ghp_fake_token_123" npx @modelcontextprotocol/inspector tsx src/day6.ts --mcp