#!/usr/bin/env node
import { readdir, readFile } from "fs/promises";
import path from "path";
import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio";

// Lock all file access strictly to the ./notes directory
const NOTES_DIR = path.resolve(process.cwd(), "notes");

const server = new McpServer({
  name: "day11-filesystem-notes",
  version: "1.0.0",
});

// ---------------------------------------------------------
// REGISTER DISCOVERABLE FILE SYSTEM RESOURCE TEMPLATE
// ---------------------------------------------------------
server.registerResource(
  "local-resource",
  new ResourceTemplate("note://local/{filename}", {
    // 1. DISCOVERY: Automatically list all .md files in ./notes
    list: async () => {
      const files = await readdir(NOTES_DIR);
      const mdFiles = files.filter((file) => file.endsWith(".md"));

      return {
        resources: mdFiles.map((file) => ({
          uri: `note://local/${file}`,
          name: file,
          mimeType: "text/markdown",
          description: `local markdown note: ${file}`,
        })),
      };
    },
  }),
  { description: "read local markdown notes from the notes/ directory" },
  async (uri, variables) => {
    const filename = String(variables.filename);
    // 2. SECURITY: Prevent directory traversal (e.g., "../.env")
    const safePath = path.resolve(NOTES_DIR, filename);
    if (!safePath.startsWith(NOTES_DIR + path.sep)) {
      throw new Error(
        `access denied: ${filename} is outside the notes directory`,
      );
    }

    try {
      const text = await readFile(safePath, "utf-8");

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "text/markdown",
            text,
          },
        ],
      };
    } catch (error) {
      throw new Error(
        `could not read note ${filename}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  },
);

// ---------------------------------------------------------
// START SERVER
// ---------------------------------------------------------
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("day 11 file systems server running on stdio");
}

main().catch((err) => {
  console.error("fatal error: ", err);
  process.exit(1);
});

// npx @modelcontextprotocol/inspector tsx src/index.ts
