/**
 * MCP Server implementation for Linear API integration
 *
 * This module defines the core server functionality for the Linear MCP integration,
 * handling tools, resources, prompts, and protocol communication.
 * @module server
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import './tools/index.js';
import './prompts/index.js';
import './resources/index.js';

import {
  ToolArgs,
  PromptArgs,
  getAllPrompts,
  getPromptHandler,
  getAllTools,
  getToolHandler,
  getAllResources,
  getResourceTemplates,
  readResource,
} from './registry.js';
import packageJson from '../package.json' with { type: 'json' };

/**
 * MCP server instance for Linear API
 *
 * Initializes the server with name, version, and capabilities information
 * to handle tools, resources, and prompts requests.
 */
export const server = new Server(
  {
    name: packageJson.name,
    version: packageJson.version,
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);

/**
 * Handle tool execution requests
 *
 * Processes incoming tool call requests, validates parameters,
 * executes the appropriate tool handler, and handles any errors.
 */
server.setRequestHandler(CallToolRequestSchema, async request => {
  const { name, arguments: args } = request.params;

  try {
    // Find the appropriate tool handler
    const handler = getToolHandler(name);

    if (!handler) {
      throw new Error(`Unknown tool: ${name}`);
    }

    // Execute the tool handler with args or empty object to satisfy TypeScript
    return await handler(args || ({} as ToolArgs));
  } catch (error) {
    console.error(`Error executing tool ${name}:`, error);
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

/**
 * Register available tools
 *
 * Returns the list of all available tools with their metadata.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: getAllTools(),
}));

/**
 * List available resources
 *
 * Returns a list of all available resources with their metadata.
 */
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: getAllResources(),
}));

/**
 * List resource templates
 *
 * Returns a list of all available resource templates with their metadata.
 */
server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => ({
  resourceTemplates: getResourceTemplates(),
}));

/**
 * Handle resource read requests
 *
 * Processes resource read requests, retrieves the resource content,
 * and handles any errors that occur during retrieval.
 *
 * @param {Object} request - The resource read request containing the URI
 * @returns {Object} Resource content or error information
 */
server.setRequestHandler(ReadResourceRequestSchema, async request => {
  const { uri } = request.params;

  try {
    const result = await readResource(uri);

    if (result.isError || !result.content) {
      return {
        contents: [],
        isError: true,
        errorMessage: result.errorMessage || `Resource not found: ${uri}`,
      };
    }

    // Ensure we return a properly formatted contents array with required fields
    return {
      contents: [result.content],
    };
  } catch (error) {
    console.error(`Error reading resource ${uri}:`, error);
    return {
      contents: [],
      isError: true,
      errorMessage: `Error reading resource: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
});

/**
 * List available prompts
 *
 * Returns a list of all available prompts with their metadata.
 */
server.setRequestHandler(ListPromptsRequestSchema, async () => ({
  prompts: getAllPrompts(),
}));

/**
 * Get a specific prompt
 *
 * Processes prompt requests, executes the appropriate prompt handler,
 * and handles any errors that occur during generation.
 *
 * @param {Object} request - The prompt request containing name and arguments
 * @returns {Object} Generated messages or error information
 */
server.setRequestHandler(GetPromptRequestSchema, async request => {
  const { name, arguments: args } = request.params;

  try {
    // Find the appropriate prompt handler
    const handler = getPromptHandler(name);

    if (!handler) {
      return {
        messages: [],
        isError: true,
        errorMessage: `Prompt not found: ${name}`,
      };
    }

    // Generate messages for the prompt
    const messages = handler((args as PromptArgs) || ({} as PromptArgs));

    return {
      messages,
    };
  } catch (error) {
    console.error(`Error generating prompt ${name}:`, error);
    return {
      messages: [],
      isError: true,
      errorMessage: `Error generating prompt: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
});
