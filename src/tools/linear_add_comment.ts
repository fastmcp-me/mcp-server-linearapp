import { registerTool, ToolHandler } from '../registry.js';
import { linearClient } from '../linear.js';

// Define the tool handler
export const linearAddCommentHandler: ToolHandler = async args => {
  const params = args as {
    issueId: string;
    body: string;
    createAsUser?: string;
    displayIconUrl?: string;
  };

  try {
    // Validate required parameters
    if (!params.issueId) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Issue ID is required',
          },
        ],
        isError: true,
      };
    }

    if (!params.body) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Comment body is required',
          },
        ],
        isError: true,
      };
    }

    // Get the issue to validate it exists
    const issue = await linearClient.issue(params.issueId);
    if (!issue) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: Issue with ID ${params.issueId} not found`,
          },
        ],
        isError: true,
      };
    }

    // Set up input parameters for comment creation
    const input: {
      issueId: string;
      body: string;
      [key: string]: unknown;
    } = {
      issueId: params.issueId,
      body: params.body,
    };

    // Add optional parameters if present
    if (params.createAsUser) input.createAsUser = params.createAsUser;
    if (params.displayIconUrl) input.displayIconUrl = params.displayIconUrl;

    // Create the comment using the Linear API
    const commentPayload = await linearClient.createComment(input);

    if (!commentPayload.success || !commentPayload.comment) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Failed to create comment',
          },
        ],
        isError: true,
      };
    }

    // Extract data for response
    const responseData = {
      body: params.body,
      url: await issue.url,
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

// Register the tool
export const linearAddCommentTool = registerTool(
  {
    name: 'linear_add_comment',
    description: 'Add a comment to a Linear issue',
    inputSchema: {
      type: 'object',
      properties: {
        issueId: {
          type: 'string',
          description: 'Issue ID to comment on',
        },
        body: {
          type: 'string',
          description: 'Comment text (markdown supported)',
        },
        createAsUser: {
          type: 'string',
          description: 'Custom username for the comment creator',
        },
        displayIconUrl: {
          type: 'string',
          description: 'Custom avatar URL for the comment creator',
        },
      },
      required: ['issueId', 'body'],
    },
  },
  linearAddCommentHandler
);
