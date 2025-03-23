import { registerTool, ToolHandler } from '../registry.js';
import { linearClient } from '../linear.js';

// Define the tool handler
export const linearGetUserIssuesHandler: ToolHandler = async args => {
  const params = args as {
    userId?: string;
    includeArchived?: boolean;
    limit?: number;
  };

  try {
    const limit = params.limit || 50;
    const includeArchived = params.includeArchived || false;
    let user;

    // If userId is provided, get that user, otherwise get the current authenticated user
    if (params.userId) {
      user = await linearClient.user(params.userId);
      if (!user) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: User with ID ${params.userId} not found`,
            },
          ],
          isError: true,
        };
      }
    } else {
      user = await linearClient.viewer;
    }

    // Get assigned issues for the user
    const assignedIssues = await user.assignedIssues({
      first: limit,
      includeArchived,
    });

    if (!assignedIssues || !assignedIssues.nodes) {
      return {
        content: [
          {
            type: 'text',
            text: "Error: Failed to fetch user's issues",
          },
        ],
        isError: true,
      };
    }

    // Process the results
    const issues = await Promise.all(
      assignedIssues.nodes.map(async issue => {
        const state = await issue.state;
        const team = await issue.team;

        return {
          id: await issue.id,
          number: await issue.number,
          title: await issue.title,
          url: await issue.url,
          priority: await issue.priority,
          state: state ? await state.name : null,
          teamName: team ? await team.name : null,
          createdAt: await issue.createdAt,
        };
      })
    );

    const userData = {
      id: await user.id,
      name: await user.name,
      displayName: await user.displayName,
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            user: userData,
            pageInfo: {
              hasNextPage: assignedIssues.pageInfo.hasNextPage,
              endCursor: assignedIssues.pageInfo.endCursor,
            },
            issues,
          }),
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
export const linearGetUserIssuesTool = registerTool(
  {
    name: 'linear_get_user_issues',
    description: 'Get issues assigned to a user',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID (omit for authenticated user)',
        },
        includeArchived: {
          type: 'boolean',
          description: 'Include archived issues',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of issues to return (default: 50)',
        },
      },
    },
  },
  linearGetUserIssuesHandler
);
