#!/usr/bin/env node
import "dotenv/config";
import { program } from "./cli/index.js";

// execute commander to route the incoming terminal arguments
program.parse(process.argv);

// to test mcp server
// npx @modelcontextprotocol/inspector tsx src/index.ts mcp

// to test cli
// npx tsx src/index.ts search "react ui framework"