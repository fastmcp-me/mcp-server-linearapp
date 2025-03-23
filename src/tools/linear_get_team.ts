import { registerTool, ToolHandler } from '../registry.js';
import { linearClient } from '../linear.js';

// Define the tool handler
export const linearGetTeamHandler: ToolHandler = async args => {
  const params = args as {
    teamId: string;
  };

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

    // Get the team
    const team = await linearClient.team(params.teamId);
    if (!team) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: Team with ID ${params.teamId} not found`,
          },
        ],
        isError: true,
      };
    }

    // Fetch team states (workflow)
    const states = await team.states();

    // Get team members
    const members = await team.members();

    // Extract team data
    const teamData = {
      id: await team.id,
      name: await team.name,
      key: await team.key,
      description: await team.description,
      color: await team.color,
      icon: await team.icon,
      private: await team.private,
      states:
        states && states.nodes
          ? await Promise.all(
              states.nodes.map(async state => ({
                id: await state.id,
                name: await state.name,
                color: await state.color,
                type: await state.type,
                position: await state.position,
              }))
            )
          : [],
      members:
        members && members.nodes
          ? await Promise.all(
              members.nodes.map(async member => {
                try {
                  // Fetch the user directly using the memberId
                  const userId = await member.id;
                  if (userId) {
                    const user = await linearClient.user(userId);
                    return user
                      ? {
                          id: await user.id,
                          name: await user.name,
                          displayName: await user.displayName,
                          email: await user.email,
                        }
                      : null;
                  }
                  return null;
                } catch (error) {
                  console.error('Error fetching team member:', error);
                  return null;
                }
              })
            ).then(results => results.filter(Boolean))
          : [],
      createdAt: await team.createdAt,
      updatedAt: await team.updatedAt,
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(teamData),
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
export const linearGetTeamTool = registerTool(
  {
    name: 'linear_get_team',
    description: 'Get details about a specific team',
    inputSchema: {
      type: 'object',
      properties: {
        teamId: {
          type: 'string',
          description: 'Team ID to get details for',
        },
      },
      required: ['teamId'],
    },
  },
  linearGetTeamHandler
);
