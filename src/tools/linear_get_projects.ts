import { registerTool, ToolHandler } from '../registry.js';
import { linearClient } from '../linear.js';

// Define the tool handler
export const linearGetProjectsHandler: ToolHandler = async args => {
  const params = args as {
    teamId?: string;
    includeArchived?: boolean;
    limit?: number;
    status?: string;
  };

  try {
    // Set up query parameters
    const queryParams: {
      first: number;
      includeArchived: boolean;
    } = {
      first: params.limit || 50,
      includeArchived: params.includeArchived || false,
    };

    // Fetch projects using the Linear API
    let projectsResponse;

    if (params.teamId) {
      // If teamId is provided, fetch projects for that team
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
      projectsResponse = await team.projects(queryParams);
    } else {
      // Otherwise, fetch all projects
      projectsResponse = await linearClient.projects(queryParams);
    }

    if (!projectsResponse) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Failed to fetch projects',
          },
        ],
        isError: true,
      };
    }

    // Filter by status if provided
    let projectNodes = projectsResponse.nodes;
    if (params.status && projectNodes.length > 0) {
      const statusFilter = params.status.toLowerCase();
      const filteredProjects = [];

      for (const project of projectNodes) {
        const projectStatus = await project.status;
        if (projectStatus) {
          const statusName = await projectStatus.name;
          if (statusName && statusName.toLowerCase() === statusFilter) {
            filteredProjects.push(project);
          }
        }
      }

      projectNodes = filteredProjects;
    }

    // Extract project data
    const projects = await Promise.all(
      projectNodes.map(async project => {
        const status = await project.status;

        // Teams is a connection, fetch the first team (if any)
        const teamsConnection = await project.teams({ first: 1 });
        const team = teamsConnection?.nodes?.[0];

        return {
          id: project.id,
          name: project.name,
          description: project.description,
          status: status ? await status.name : null,
          teamId: team ? await team.id : null,
          teamName: team ? await team.name : null,
          startDate: project.startDate,
          targetDate: project.targetDate,
          url: project.url,
          progress: project.progress,
          priority: project.priority,
          color: project.color,
          icon: project.icon,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        };
      })
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(projects),
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
export const linearGetProjectsTool = registerTool(
  {
    name: 'linear_get_projects',
    description: 'Get projects in the organization',
    inputSchema: {
      type: 'object',
      properties: {
        teamId: {
          type: 'string',
          description: 'Filter projects by team ID',
        },
        includeArchived: {
          type: 'boolean',
          description: 'Include archived projects',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of projects to return (default: 50)',
        },
        status: {
          type: 'string',
          description: "Filter by project status (e.g., 'completed', 'in progress')",
        },
      },
    },
  },
  linearGetProjectsHandler
);
