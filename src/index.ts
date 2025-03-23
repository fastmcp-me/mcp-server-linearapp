#!/usr/bin/env node

/**
 * Entry point for the Linear MCP server
 *
 * Initializes the MCP server with Linear API integration,
 * sets up process signal handlers, and starts the server.
 * @module index
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { server } from './server.js';
import { validateConfig } from './config.js';

/**
 * Main function to start the server
 *
 * Validates configuration, initializes the server transport,
 * connects the server, and handles any startup errors.
 *
 * @returns {Promise<void>} A promise that resolves when the server is running
 * @throws {Error} If configuration is invalid or server fails to start
 */
export async function main(): Promise<void> {
  try {
    // Validate required configuration
    validateConfig();

    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Linear MCP Server running...');
  } catch (error) {
    console.error('Startup error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Handle process exits
process.on('SIGINT', () => {
  console.error('Received SIGINT, shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('Received SIGTERM, shutting down...');
  process.exit(0);
});

// Start the server
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
