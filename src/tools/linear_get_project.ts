import { registerTool, ToolHandler } from '../registry.js';
import { linearClient } from '../linear.js';

// Define the tool handler
export const linearGetProjectHandler: ToolHandler = async args => {
  const params = args as {
    projectId: string;
  };

  try {
    // Validate required parameters
    if (!params.projectId) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Project ID is required',
          },
        ],
        isError: true,
      };
    }

    // Get the project
    const project = await linearClient.project(params.projectId);
    if (!project) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: Project with ID ${params.projectId} not found`,
          },
        ],
        isError: true,
      };
    }

    // Fetch related entities
    const status = await project.status;
    // Teams is a connection, not a single team - need to fetch the first one if exists
    const teamsConnection = await project.teams({ first: 1 });
    const team = teamsConnection?.nodes?.[0];
    const creator = await project.creator;
    // Project lead is a single user, not a connection
    const lead = await project.lead;

    // Extract project data
    const projectData = {
      id: project.id,
      name: project.name,
      description: project.description,
      content: project.content,
      url: project.url,
      color: project.color,
      icon: project.icon,
      status: status
        ? {
            id: await status.id,
            name: await status.name,
            color: await status.color,
            type: await status.type,
          }
        : null,
      team: team
        ? {
            id: await team.id,
            name: await team.name,
            key: await team.key,
          }
        : null,
      creator: creator
        ? {
            id: await creator.id,
            name: await creator.name,
            displayName: await creator.displayName,
          }
        : null,
      lead: lead
        ? {
            id: await lead.id,
            name: await lead.name,
            displayName: await lead.displayName,
          }
        : null,
      progress: project.progress,
      startDate: project.startDate,
      targetDate: project.targetDate,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      completedAt: project.completedAt,
      canceledAt: project.canceledAt,
      archivedAt: project.archivedAt,
      priority: project.priority,
      slugId: project.slugId,
      sortOrder: project.sortOrder,
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(projectData),
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
export const linearGetProjectTool = registerTool(
  {
    name: 'linear_get_project',
    description: 'Get details about a specific project',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'Project ID to get details for',
        },
      },
      required: ['projectId'],
    },
  },
  linearGetProjectHandler
);
