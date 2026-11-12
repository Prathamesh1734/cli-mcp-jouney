#!/usr/bin/env node
import "dotenv/config";
import { Command } from "commander";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio";
import { z } from "zod";

// ---------------------------------------------------------
// 1. BUSINESS LOGIC
// ---------------------------------------------------------
async function fetchGithubProfile(username: string) {
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "Day7-Professional-CLI",
  };

  //   if (token) headers["Authorization"] = `Bearer ${token}`;
  const response = await fetch(`https://api.github.com/users/${username}`, {
    headers,
  });

  if (!response.ok)
    throw new Error(`github api fetch error: ${response.statusText}`);

  const data = await response.json();
  return { username: data.login, name: data.name, followers: data.followers };
}

// ---------------------------------------------------------
// 2. CLI CONFIGURATION (Commander.js)
// ---------------------------------------------------------

const program = new Command();

program
  .name("day7-tool")
  .description("professional dual purpose cli and mcp server")
  .version("1.0.0");

// command 1: the human cli route

program
  .command("profile <username>")
  .description("fetch public github details for a user")
  .action(async (username) => {
    console.log(`\n🔍 fetching profile for ${username}...\n`);
    try {
      const profile = await fetchGithubProfile(username);
      console.table(profile);
    } catch (error) {
      console.error(
        "❌ failed:",
        error instanceof Error ? error.message : error,
      );
      //   process.exit(1);
      process.exitCode = 1; // Use exitCode instead of process.exit(1) to avoid the Windows C++ crash
    }
  });

// command 2: the ai mcp route
program
  .command("mcp")
  .description("start the mcp server for ai clients")
  .action(async () => {
    const server = new McpServer({
      name: "professional-mcp-server",
      version: "1.0.0",
    });

    server.registerTool(
      "get_github_profile",
      {
        description: "fetch a github user's profile details",
        inputSchema: {
          username: z.string().describe("the github username"),
        },
      },
      async ({ username }) => {
        try {
          const profile = await fetchGithubProfile(username);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(profile, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            isError: true,
            content: [
              {
                type: "text",
                text: String(error),
              },
            ],
          };
        }
      },
    );

    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("day 7 server running on stdio");
  });

// 3. EXUCUTE COMMANDER
program.parse(process.argv);

// to run with Commander
// npx tsx src/index.ts --help

// test cli
// npx tsx src/index.ts profile Prathamesh1734

// test mcp
// npx @modelcontextprotocol/inspector tsx src/index.ts mcp
