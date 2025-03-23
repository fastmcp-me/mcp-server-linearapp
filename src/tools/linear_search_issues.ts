import { registerTool, ToolHandler } from '../registry.js';
import { linearClient } from '../linear.js';

// Define the tool handler
export const linearSearchIssuesHandler: ToolHandler = async args => {
  const params = args as {
    query: string;
    includeArchived?: boolean;
    limit?: number;
  };

  try {
    // Validate required parameters
    if (!params.query) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Search query is required',
          },
        ],
        isError: true,
      };
    }

    // Set up search parameters
    const searchParams = {
      first: params.limit || 10,
      includeArchived: params.includeArchived || false,
      query: params.query,
    };

    // Search for issues using the Linear API
    const searchResult = await linearClient.issueSearch(searchParams);

    if (!searchResult || !searchResult.nodes) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Failed to search issues',
          },
        ],
        isError: true,
      };
    }

    // Extract issue data with proper awaits
    const issues = await Promise.all(
      searchResult.nodes.map(async issue => {
        const state = issue.state ? await issue.state : null;
        const team = issue.team ? await issue.team : null;
        const assignee = issue.assignee ? await issue.assignee : null;

        return {
          id: await issue.id,
          identifier: await issue.identifier,
          title: await issue.title,
          description: await issue.description,
          url: await issue.url,
          state: state?.name,
          team: team?.name,
          assignee: assignee?.name,
          createdAt: await issue.createdAt,
          updatedAt: await issue.updatedAt,
        };
      })
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            pageInfo: {
              hasNextPage: searchResult.pageInfo.hasNextPage,
              endCursor: searchResult.pageInfo.endCursor,
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
export const linearSearchIssuesTool = registerTool(
  {
    name: 'linear_search_issues',
    description: 'Search issues in Linear with flexible filtering',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Text to search in title/description',
        },
        includeArchived: {
          type: 'boolean',
          description: 'Include archived issues',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of issues to return (default: 10)',
        },
      },
    },
  },
  linearSearchIssuesHandler
);
