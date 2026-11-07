#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ---------------------------------------------------------
// 1. CORE BUSINESS LOGIC (Shared by both CLI and MCP)
// ---------------------------------------------------------
async function fetchGithubRepos(username: string) {
  // fetch 5 most recently updated repositories
  const res = await fetch(
    `https://api.github.com/users/${username}/repos?sort=updated&per_page=5`,
  );

  if (!res.ok) {
    throw new Error(`Github api error: ${res.statusText}`);
  }

  const data = await res.json();

  // strip out massive api payload into just what we need
  return data.map((repo: any) => ({
    name: repo.name,
    stars: repo.stargazers_count,
    language: repo.language || "unknown",
    url: repo.html_url,
  }));
}

// ---------------------------------------------------------
// 2. ROUTER
// ---------------------------------------------------------
const args = process.argv.slice(2);

if (args.includes("--mcp")) {
  runMcpServer();
} else {
  runCli(args);
}

// ---------------------------------------------------------
// 3. HUMAN MODE: CLI Interface
// ---------------------------------------------------------
async function runCli(args: string[]) {
  const username = args[0];

  if (!username || username.startsWith("--")) {
    console.log("usage: tsx src/day.ts <github-username>");
    console.log("example: tsx src/day.ts Prathamesh1734");
    process.exit(1);
  }

  console.log(`\n🔍 fetching latest repos for ${username}...\n`);

  try {
    const repos = await fetchGithubRepos(username);
    // console.table creates a beautiful grid in the terminal automatically
    console.table(repos);
  } catch (error) {
    console.error(
      "❌ failed: ",
      error instanceof Error ? error.message : error,
    );
  }
}

// ---------------------------------------------------------
// 4. AI MODE: MCP Server Interface
// ---------------------------------------------------------
async function runMcpServer() {
  const server = new McpServer({
    name: "github-mcp-server",
    version: "1.0.0",
  });

  server.registerTool(
    "get_github_repos",
    {
      description:
        "fetch the most recently updated github repositories for a specific user.",
      inputSchema: {
        username: z.string().describe("the github username to look up"),
      },
    },
    async ({ username }) => {
      try {
        const repos = await fetchGithubRepos(username);

        return {
          content: [
            {
              type: "text",
              text: `successfully fetched repos for ${username}: \n\n${JSON.stringify(repos, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        // using resiliant error handling pattern
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `failed to fetch repos: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    },
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("day5 github server running on stdio");
}

// to run cli
// npx tsx src/index.ts Prathamesh1734

// to run mcp
// npx @modelcontextprotocol/inspector tsx src/index.ts --mcp
