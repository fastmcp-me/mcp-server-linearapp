import { registerTool, ToolHandler } from '../registry.js';
import { linearClient } from '../linear.js';

// Define the tool handler
export const linearGetProjectIssuesHandler: ToolHandler = async args => {
  const params = args as {
    projectId: string;
    includeArchived?: boolean;
    limit?: number;
    status?: string;
    priority?: number;
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

    // Set up query parameters
    const queryParams: {
      first: number;
      includeArchived: boolean;
      filter?: {
        stateId?: { eq: string };
        priority?: { eq: number };
      };
    } = {
      first: params.limit || 50,
      includeArchived: params.includeArchived || false,
    };

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

    // Get project issues
    const issuesResponse = await project.issues(queryParams);
    if (!issuesResponse || !issuesResponse.nodes) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Failed to fetch project issues',
          },
        ],
        isError: true,
      };
    }

    let issues = issuesResponse.nodes;

    // Filter by status if provided
    if (params.status && issues.length > 0) {
      const status = params.status.toLowerCase();
      const filteredIssues = [];

      for (const issue of issues) {
        const state = await issue.state;
        if (state && typeof state === 'object') {
          const stateName = await state.name;
          if (stateName && stateName.toLowerCase() === status) {
            filteredIssues.push(issue);
          }
        }
      }

      issues = filteredIssues;
    }

    // Filter by priority if provided
    if (params.priority !== undefined && issues.length > 0) {
      const filteredIssues = [];

      for (const issue of issues) {
        const priority = await issue.priority;
        if (priority === params.priority) {
          filteredIssues.push(issue);
        }
      }

      issues = filteredIssues;
    }

    // Extract issue data
    const issueData = await Promise.all(
      issues.map(async issue => {
        const state = await issue.state;
        const assignee = await issue.assignee;

        return {
          id: await issue.id,
          identifier: await issue.identifier,
          title: await issue.title,
          description: await issue.description,
          state: state && typeof state === 'object' ? await state.name : null,
          assignee: assignee && typeof assignee === 'object' ? await assignee.name : null,
          priority: await issue.priority,
          url: await issue.url,
          createdAt: await issue.createdAt,
          updatedAt: await issue.updatedAt,
        };
      })
    );

    // Get project data
    const projectStatus = await project.status;

    const projectData = {
      id: project.id,
      name: project.name,
      status: projectStatus ? await projectStatus.name : null,
      issues: issueData,
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
export const linearGetProjectIssuesTool = registerTool(
  {
    name: 'linear_get_project_issues',
    description: 'Get issues for a specific project',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'Project ID to get issues for',
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
      },
      required: ['projectId'],
    },
  },
  linearGetProjectIssuesHandler
);
