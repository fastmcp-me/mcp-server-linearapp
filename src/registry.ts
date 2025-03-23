import { Tool, Prompt } from "@modelcontextprotocol/sdk/types.js";
import {
  McpResource,
  McpResourceContent,
  McpResourceTemplate,
} from "./types.js";

// Define types for arguments
export type ToolArgs = Record<string, unknown>;
export type PromptArgs = Record<string, string>;
export type ResourceArgs = Record<string, unknown>;

// Define response types
export type ToolResponse = {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
};

export type PromptResponse = Array<{
  role: string;
  content: {
    type: string;
    text: string;
  };
}>;

export type ResourceResponse<T = unknown> = {
  data: T;
  isError?: boolean;
  errorMessage?: string;
};

// Define handler types
export type ToolHandler = (args: ToolArgs) => Promise<ToolResponse>;
export type PromptHandler = (args: PromptArgs) => PromptResponse;
export type ResourceHandler = (args: ResourceArgs) => Promise<ResourceResponse>;

// Registry types
interface ToolRegistry {
  tools: Record<string, Tool>;
  toolHandlers: Record<string, ToolHandler>;
}

interface PromptRegistry {
  prompts: Record<string, Prompt>;
  promptHandlers: Record<string, PromptHandler>;
}

interface ResourceRegistry {
  resources: Record<string, McpResource | McpResourceTemplate>;
  resourceHandlers: Record<string, ResourceHandler>;
}

// Initialize registries
const toolRegistry: ToolRegistry = {
  tools: {},
  toolHandlers: {},
};

const promptRegistry: PromptRegistry = {
  prompts: {},
  promptHandlers: {},
};

const resourceRegistry: ResourceRegistry = {
  resources: {},
  resourceHandlers: {},
};

/**
 * Get the tool registry
 * @returns The tool registry object
 */
export function getToolRegistry(): ToolRegistry {
  return toolRegistry;
}

/**
 * Get the prompt registry
 * @returns The prompt registry object
 */
export function getPromptRegistry(): PromptRegistry {
  return promptRegistry;
}

/**
 * Get the resource registry
 * @returns The resource registry object
 */
export function getResourceRegistry(): ResourceRegistry {
  return resourceRegistry;
}

/**
 * Registers a tool in the global registry
 * @param tool Tool definition
 * @param handler Function that implements the tool's logic
 * @returns The registered tool (for chaining)
 */
export const registerTool = (tool: Tool, handler: ToolHandler): Tool => {
  toolRegistry.tools[tool.name] = tool;
  toolRegistry.toolHandlers[tool.name] = handler;
  return tool;
};

/**
 * Gets all registered tools
 * @returns Array of all registered tools
 */
export const getAllTools = (): Tool[] => Object.values(toolRegistry.tools);

/**
 * Gets the handler function for a specific tool
 * @param name Name of the tool
 * @returns The tool's handler function or undefined if not found
 */
export const getToolHandler = (name: string): ToolHandler | undefined => toolRegistry.toolHandlers[name];

/**
 * Registers a prompt in the global registry
 * @param prompt Prompt definition
 * @param handler Function that implements the prompt's message generation
 * @returns The registered prompt (for chaining)
 */
export const registerPrompt = (
  prompt: Prompt,
  handler: PromptHandler
): Prompt => {
  promptRegistry.prompts[prompt.name] = prompt;
  promptRegistry.promptHandlers[prompt.name] = handler;
  return prompt;
};

/**
 * Gets all registered prompts
 * @returns Array of all registered prompts
 */
export const getAllPrompts = (): Prompt[] => Object.values(promptRegistry.prompts);

/**
 * Gets a specific prompt by name
 * @param name Name of the prompt to retrieve
 * @returns The prompt or undefined if not found
 */
export const getPromptByName = (name: string): Prompt | undefined => promptRegistry.prompts[name];

/**
 * Gets the handler function for a specific prompt
 * @param name Name of the prompt
 * @returns The prompt's handler function or undefined if not found
 */
export const getPromptHandler = (name: string): PromptHandler | undefined => promptRegistry.promptHandlers[name];

/**
 * Registers a resource in the global registry
 * @param resource Resource definition
 * @param handler Function that implements the resource's logic
 * @returns The registered resource (for chaining)
 */
export const registerResource = (
  resource: McpResource | McpResourceTemplate,
  handler: ResourceHandler
): McpResource | McpResourceTemplate => {
  const key = "uri" in resource ? resource.uri : resource.uriTemplate;
  resourceRegistry.resources[key] = resource;
  resourceRegistry.resourceHandlers[key] = handler;
  return resource;
};

/**
 * Gets all registered resources
 * @returns Array of all registered resources
 */
export const getAllResources = (): McpResource[] => Object.values(resourceRegistry.resources).filter(
    (resource): resource is McpResource => "uri" in resource
  );

/**
 * Gets all resource templates
 * @returns Array of all resource templates
 */
export const getResourceTemplates = (): McpResourceTemplate[] => Object.values(resourceRegistry.resources).filter(
    (resource): resource is McpResourceTemplate => "uriTemplate" in resource
  );

/**
 * Gets a specific resource by URI
 * @param uri URI of the resource to retrieve
 * @returns The resource or undefined if not found
 */
export const getResourceByUri = (
  uri: string
): McpResource | McpResourceTemplate | undefined => resourceRegistry.resources[uri];

/**
 * Gets the handler function for a specific resource
 * @param uri URI of the resource
 * @returns The resource's handler function or undefined if not found
 */
export const getResourceHandler = (
  uri: string
): ResourceHandler | undefined => resourceRegistry.resourceHandlers[uri];

/**
 * Reads the content of a resource
 * @param uri URI of the resource to read
 * @param args Optional arguments for the resource handler
 * @returns Resource content or error response
 */
export const readResource = async (
  uri: string,
  args?: Record<string, unknown>
): Promise<{
  content?: McpResourceContent;
  isError: boolean;
  errorMessage?: string;
}> => {
  const handler = getResourceHandler(uri);

  if (!handler) {
    return {
      isError: true,
      errorMessage: `Resource not found: ${uri}`,
    };
  }

  try {
    const response = await handler(args || {});

    if (response.isError) {
      return {
        isError: true,
        errorMessage: response.errorMessage || `Error reading resource: ${uri}`,
      };
    }

    // Ensure the content has the required fields (uri and either text or blob)
    const content = response.data as McpResourceContent;

    // If the content doesn't have a uri, use the requested uri
    if (!content.uri) {
      content.uri = uri;
    }

    // Ensure either text or blob is present
    if (!content.text && !content.blob) {
      return {
        isError: true,
        errorMessage: `Invalid resource content: missing both text and blob for ${uri}`,
      };
    }

    return {
      content,
      isError: false,
    };
  } catch (error) {
    return {
      isError: true,
      errorMessage:
        error instanceof Error
          ? error.message
          : `Unknown error reading resource: ${uri}`,
    };
  }
};
