#!/usr/bin/env node
import "dotenv/config";
import { program } from "./cli/index.js";

// execute commander to route the incoming terminal arguments
program.parse(process.argv);
