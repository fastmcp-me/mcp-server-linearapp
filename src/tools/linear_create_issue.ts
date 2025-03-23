/**
 * Linear Create Issue Tool
 *
 * Provides a tool to create new issues in Linear through the MCP protocol.
 * @module tools/linear_create_issue
 */
import { registerTool, ToolHandler } from '../registry.js';
import { linearClient } from '../linear.js';

/**
 * Interface for create issue parameters
 */
interface CreateIssueParams {
  /** Team ID to create the issue in (required) */
  teamId: string;
  /** Issue title (required) */
  title: string;
  /** Issue description in markdown format */
  description?: string;
  /** ID of the state to set for the issue */
  stateId?: string;
  /** ID of the user to assign the issue to */
  assigneeId?: string;
  /** Priority level (0-4), where 0=no priority, 1=urgent, 4=low */
  priority?: number;
  /** Array of label IDs to apply to the issue */
  labelIds?: string[];
}

/**
 * Create issue tool handler
 *
 * Validates input parameters, creates a new issue in Linear,
 * and returns the created issue information.
 *
 * @param {object} args - Tool arguments
 * @returns {object} Tool response with created issue data or error
 */
export const linearCreateIssueHandler: ToolHandler = async args => {
  // Use a safer type assertion with unknown as intermediate step
  const params = args as unknown as CreateIssueParams;

  try {
    // Validate required parameters
    if (!params.teamId) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Team ID is required',
          },
        ],
        isError: true,
      };
    }

    if (!params.title) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Title is required',
          },
        ],
        isError: true,
      };
    }

    // Set up input parameters for issue creation with proper typing
    const input: {
      teamId: string;
      title: string;
      description?: string;
      stateId?: string;
      assigneeId?: string;
      priority?: number;
      labelIds?: string[];
    } = {
      teamId: params.teamId,
      title: params.title,
    };

    // Add optional parameters if provided
    if (params.description) input.description = params.description;
    if (params.stateId) input.stateId = params.stateId;
    if (params.assigneeId) input.assigneeId = params.assigneeId;
    if (params.priority !== undefined) input.priority = params.priority;
    if (params.labelIds && params.labelIds.length > 0) {
      input.labelIds = params.labelIds;
    }

    // Create the issue using the Linear API
    const issuePayload = await linearClient.createIssue(input);

    if (!issuePayload.success || !issuePayload.issue) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Failed to create issue',
          },
        ],
        isError: true,
      };
    }

    // Get the issue and await all properties by awaiting the entire issue first
    const issue_data = await issuePayload.issue;

    // Get formatted response data
    const responseData = {
      id: issue_data.id,
      title: issue_data.title,
      identifier: issue_data.identifier,
      url: issue_data.url,
      createdAt: new Date().toISOString(),
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(responseData),
        },
      ],
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : 'Unknown error occurred';

    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
};

/**
 * Linear Create Issue Tool Registration
 *
 * Registers the tool with the MCP registry including metadata,
 * input schema, and handler function.
 */
export const linearCreateIssueTool = registerTool(
  {
    name: 'linear_create_issue',
    description: 'Create a new Linear issue',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Issue title',
        },
        teamId: {
          type: 'string',
          description: 'Team ID to create issue in',
        },
        description: {
          type: 'string',
          description: 'Issue description (markdown supported)',
        },
        priority: {
          type: 'number',
          description: 'Priority level (0-4), where 0=no priority, 1=urgent, 4=low',
        },
        status: {
          type: 'string',
          description: "Initial status name (e.g., 'Todo', 'In Progress')",
        },
        assigneeId: {
          type: 'string',
          description: 'User ID to assign the issue to',
        },
      },
      required: ['title', 'teamId'],
    },
  },
  linearCreateIssueHandler
);
