import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio";
import { z } from "zod";
import { fetchGithubProfile, searchGithubRepos } from "../api/github.js";

export async function runMcpServer() {
  const server = new McpServer({
    name: "modular-mcp-server",
    version: "1.0.0",
  });

  server.registerTool(
    "get_github_profile",
    {
      description: "fetch a github user profile details",
      inputSchema: { username: z.string().describe("the github username") },
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

  server.registerTool(
    "search_github_repos",
    {
      description: "search for public github repositories based on a query",
      inputSchema: {
        query: z.string().describe("the search query"),
      },
    },
    async ({ query }) => {
      try {
        const repos = await searchGithubRepos(query);
        return {
          content: [
            {
              type: "text",
              text: `search result for '${query}':\n\n${JSON.stringify(repos, null, 2)}`,
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
  console.error("day 8 mcp server running on stdio");
}
