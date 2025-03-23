import { registerTool, ToolHandler } from '../registry.js';
import { linearClient } from '../linear.js';

// Define the tool handler
export const linearGetTeamsHandler: ToolHandler = async () => {
  try {
    // Fetch teams using the Linear API
    const teamsResponse = await linearClient.teams();

    if (!teamsResponse) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Failed to fetch teams',
          },
        ],
        isError: true,
      };
    }

    // Extract team data
    const teams = teamsResponse.nodes.map(team => ({
      id: team.id,
      name: team.name,
      key: team.key,
      description: team.description || '',
    }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(teams),
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
export const linearGetTeamsTool = registerTool(
  {
    name: 'linear_get_teams',
    description: 'Get teams in the organization',
    inputSchema: {
      type: 'object',
      properties: {
        includeArchived: {
          type: 'boolean',
          description: 'Include archived teams',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of teams to return (default: 50)',
        },
      },
    },
  },
  linearGetTeamsHandler
);
