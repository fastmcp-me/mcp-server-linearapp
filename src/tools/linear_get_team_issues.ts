import { registerTool, ToolHandler } from '../registry.js';
import { linearClient } from '../linear.js';

// Define the tool handler
export const linearGetTeamIssuesHandler: ToolHandler = async args => {
  const params = args as {
    teamId: string;
    includeArchived?: boolean;
    limit?: number;
    status?: string;
    priority?: number;
    assigneeId?: string;
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

    // Set up query parameters
    const queryParams: {
      first: number;
      includeArchived: boolean;
      filter?: {
        stateId?: { eq: string };
        priority?: { eq: number };
        assigneeId?: { eq: string };
      };
    } = {
      first: params.limit || 50,
      includeArchived: params.includeArchived || false,
    };

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

    // Setup filter
    const filter: {
      stateId?: { eq: string };
      priority?: { eq: number };
      assigneeId?: { eq: string };
    } = {};

    // Add status filter if provided
    if (params.status) {
      const states = await team.states();
      const state = states.nodes.find(s => s.name.toLowerCase() === params.status?.toLowerCase());

      if (!state) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: Status "${params.status}" not found for team ${await team.name}`,
            },
          ],
          isError: true,
        };
      }

      filter.stateId = { eq: state.id };
    }

    // Add priority filter
    if (params.priority !== undefined) {
      filter.priority = { eq: params.priority };
    }

    // Add assignee filter
    if (params.assigneeId) {
      filter.assigneeId = { eq: params.assigneeId };
    }

    // Add filter to query params if we have any filters
    if (Object.keys(filter).length > 0) {
      queryParams.filter = filter;
    }

    // Get team issues
    const issuesResponse = await team.issues(queryParams);
    if (!issuesResponse || !issuesResponse.nodes) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Failed to fetch team issues',
          },
        ],
        isError: true,
      };
    }

    // Extract issue data
    const issueData = await Promise.all(
      issuesResponse.nodes.map(async issue => {
        const state = await issue.state;
        const assignee = await issue.assignee;

        return {
          id: await issue.id,
          identifier: await issue.identifier,
          title: await issue.title,
          description: await issue.description,
          state: state ? await state.name : null,
          assignee: assignee ? await assignee.name : null,
          priority: await issue.priority,
          url: await issue.url,
          createdAt: await issue.createdAt,
          updatedAt: await issue.updatedAt,
        };
      })
    );

    // Get team data
    const teamData = {
      id: await team.id,
      name: await team.name,
      key: await team.key,
      issues: issueData,
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
export const linearGetTeamIssuesTool = registerTool(
  {
    name: 'linear_get_team_issues',
    description: 'Get issues for a specific team',
    inputSchema: {
      type: 'object',
      properties: {
        teamId: {
          type: 'string',
          description: 'Team ID to get issues for',
        },
        includeArchived: {
          type: 'boolean',
          description: 'Include archived issues',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of issues to return (default: 50)',
        },
        status: {
          type: 'string',
          description: 'Filter by issue status name',
        },
        priority: {
          type: 'number',
          description: 'Filter by priority level (0-4), where 0=no priority, 1=urgent, 4=low',
        },
        assigneeId: {
          type: 'string',
          description: 'Filter by assignee ID',
        },
      },
      required: ['teamId'],
    },
  },
  linearGetTeamIssuesHandler
);
