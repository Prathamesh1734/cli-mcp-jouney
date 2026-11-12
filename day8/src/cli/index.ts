import { Command } from "commander";
import { fetchGithubProfile } from "../api/github.js";
import { runMcpServer } from "../mcp/server.js";

export const program = new Command();

program
  .name("day8-tool")
  .description("a modular dual purpose cli and mcp server")
  .version("1.0.0");

program
  .command("profile <username>")
  .description("fetch public github profile details for a user")
  .action(async (username) => {
    console.log(`\n🔍 fetching profile details for ${username}...\n`);
    try {
      const profile = await fetchGithubProfile(username);
      console.table(profile);
    } catch (error) {
      console.error(
        "❌ failed: ",
        error instanceof Error ? error.message : error,
      );
      process.exitCode = 1;
    }
  });

program
  .command("cli")
  .description("start the mcp server for ai clients")
  .action(async () => {
    await runMcpServer();
  });
