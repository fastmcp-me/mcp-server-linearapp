/**
 * Linear Project Resources Module
 *
 * Defines resource templates and handlers for Linear project resources.
 *
 * @module resources/linear-project
 */
import { McpResourceTemplate } from '../types.js';
import { registerResource, ResourceHandler, ResourceArgs, ResourceResponse } from '../registry.js';
import { linearClient } from '../linear.js';

/**
 * Linear Project resource template
 */
const linearProjectResourceTemplate: McpResourceTemplate = {
  uriTemplate: 'linear-project:///{projectId}',
  name: 'linear-project',
  description: 'Linear project details',
  mimeType: 'application/json',
};

/**
 * Linear Project Issues resource template
 */
const linearProjectIssuesResourceTemplate: McpResourceTemplate = {
  uriTemplate: 'linear-project:///{projectId}/issues',
  name: 'linear-project-issues',
  description: 'Linear project issues',
  mimeType: 'application/json',
};

/**
 * Linear Project Milestones resource template
 */
const linearProjectMilestonesResourceTemplate: McpResourceTemplate = {
  uriTemplate: 'linear-project:///{projectId}/milestones',
  name: 'linear-project-milestones',
  description: 'Linear project milestones',
  mimeType: 'application/json',
};

// Define types for the responses
export interface LinearProjectDetailResponse {
  id: string;
  name: string;
  description: string;
  color: string;
  icon?: string;
  progress: number;
  status?: {
    id: string;
    name: string;
    color: string;
    type: string;
  };
  lead?: {
    id: string;
    name: string;
    displayName: string;
  };
  teams: Array<{
    id: string;
    name: string;
    key: string;
  }>;
  members: Array<{
    id: string;
    name: string;
    displayName: string;
  }>;
  startDate?: string;
  targetDate?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LinearProjectIssuesResponse {
  project: {
    id: string;
    name: string;
    description: string;
  };
  issues: Array<{
    id: string;
    title: string;
    identifier: string;
    description?: string;
    status: string;
    priority: number;
    assignee?: {
      id: string;
      name: string;
      displayName: string;
    };
    url: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
}

export interface LinearProjectMilestonesResponse {
  project: {
    id: string;
    name: string;
    description: string;
  };
  milestones: Array<{
    id: string;
    name: string;
    description?: string;
    targetDate?: string;
    status: string;
    sortOrder: number;
    issues: {
      total: number;
      completed: number;
    };
    createdAt: Date;
    updatedAt: Date;
  }>;
  stats: {
    total: number;
    byStatus: Record<string, number>;
    upcoming: number;
    overdue: number;
    completed: number;
  };
}

/**
 * Handler for Linear project resources
 */
export const linearProjectResourceHandler: ResourceHandler = async (
  args: ResourceArgs
): Promise<ResourceResponse<LinearProjectDetailResponse | null>> => {
  try {
    // Extract the projectId from the URI
    const projectId = args.projectId as string;

    if (!projectId) {
      return {
        isError: true,
        errorMessage: 'Invalid project ID',
        data: null,
      };
    }

    // Fetch the project from Linear
    const project = await linearClient.project(projectId);
    if (!project) {
      return {
        isError: true,
        errorMessage: `Project with ID ${projectId} not found`,
        data: null,
      };
    }

    // Fetch related entities
    const status = await project.status;
    const lead = await project.lead;
    const teamsConnection = await project.teams();
    const teams = teamsConnection?.nodes || [];
    const membersConnection = await project.members();
    const members = membersConnection?.nodes || [];

    // Format the response
    return {
      data: {
        id: project.id,
        name: project.name,
        description: project.description,
        color: project.color,
        icon: project.icon,
        progress: project.progress,
        status: status
          ? {
              id: await status.id,
              name: await status.name,
              color: await status.color,
              type: await status.type,
            }
          : undefined,
        lead: lead
          ? {
              id: await lead.id,
              name: await lead.name,
              displayName: await lead.displayName,
            }
          : undefined,
        teams: await Promise.all(
          teams.map(async team => ({
            id: team.id,
            name: team.name,
            key: team.key,
          }))
        ),
        members: await Promise.all(
          members.map(async member => ({
            id: member.id,
            name: member.name,
            displayName: member.displayName,
          }))
        ),
        startDate: project.startDate,
        targetDate: project.targetDate,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      } as LinearProjectDetailResponse,
      isError: false,
    };
  } catch (error) {
    return {
      isError: true,
      errorMessage: typeof error === 'string' ? error : String(error),
      data: null,
    };
  }
};

/**
 * Handler for Linear project issues resources
 */
export const linearProjectIssuesResourceHandler: ResourceHandler = async (
  args: ResourceArgs
): Promise<ResourceResponse<LinearProjectIssuesResponse | null>> => {
  try {
    // Extract the projectId from the URI
    const projectId = args.projectId as string;

    if (!projectId) {
      return {
        isError: true,
        errorMessage: 'Invalid project ID',
        data: null,
      };
    }

    // Fetch the project from Linear
    const project = await linearClient.project(projectId);
    if (!project) {
      return {
        isError: true,
        errorMessage: `Project with ID ${projectId} not found`,
        data: null,
      };
    }

    // Fetch the project's issues
    const issuesConnection = await project.issues({ first: 50 });
    const issues = issuesConnection?.nodes || [];

    // Format the response
    return {
      data: {
        project: {
          id: project.id,
          name: project.name,
          description: project.description,
        },
        issues: await Promise.all(
          issues.map(async issue => {
            const state = await issue.state;
            const assignee = await issue.assignee;

            return {
              id: issue.id,
              title: issue.title,
              identifier: issue.identifier,
              description: issue.description,
              status: state ? await state.name : 'Unknown',
              priority: issue.priority,
              assignee: assignee
                ? {
                    id: await assignee.id,
                    name: await assignee.name,
                    displayName: await assignee.displayName,
                  }
                : undefined,
              url: issue.url,
              createdAt: issue.createdAt,
              updatedAt: issue.updatedAt,
            };
          })
        ),
      } as LinearProjectIssuesResponse,
      isError: false,
    };
  } catch (error) {
    return {
      isError: true,
      errorMessage: typeof error === 'string' ? error : String(error),
      data: null,
    };
  }
};

/**
 * Handler for Linear project milestones resources
 */
export const linearProjectMilestonesResourceHandler: ResourceHandler = async (
  args: ResourceArgs
): Promise<ResourceResponse<LinearProjectMilestonesResponse | null>> => {
  try {
    // Extract the projectId from the URI
    const projectId = args.projectId as string;

    if (!projectId) {
      return {
        isError: true,
        errorMessage: 'Invalid project ID',
        data: null,
      };
    }

    // Fetch the project from Linear
    const project = await linearClient.project(projectId);
    if (!project) {
      return {
        isError: true,
        errorMessage: `Project with ID ${projectId} not found`,
        data: null,
      };
    }

    // In a real implementation, we would fetch the milestones from Linear
    // For now, we'll simulate with mock data
    const mockMilestones = [
      {
        id: 'milestone1',
        name: 'Alpha Release',
        description: 'Initial feature-complete release for internal testing',
        targetDate: '2023-06-15',
        status: 'completed',
        sortOrder: 1,
        issues: {
          total: 5,
          completed: 5,
        },
        createdAt: new Date('2023-01-15T12:00:00Z'),
        updatedAt: new Date('2023-06-18T09:30:00Z'),
      },
      {
        id: 'milestone2',
        name: 'Beta Release',
        description: 'Public beta testing phase',
        targetDate: '2023-08-01',
        status: 'inProgress',
        sortOrder: 2,
        issues: {
          total: 8,
          completed: 5,
        },
        createdAt: new Date('2023-01-15T12:10:00Z'),
        updatedAt: new Date('2023-07-10T11:45:00Z'),
      },
      {
        id: 'milestone3',
        name: 'Final Release',
        description: 'Production launch',
        targetDate: '2023-09-30',
        status: 'planned',
        sortOrder: 3,
        issues: {
          total: 10,
          completed: 0,
        },
        createdAt: new Date('2023-01-15T12:20:00Z'),
        updatedAt: new Date('2023-01-15T12:20:00Z'),
      },
    ];

    // Calculate statistics
    const stats = {
      total: mockMilestones.length,
      byStatus: {} as Record<string, number>,
      upcoming: 0,
      overdue: 0,
      completed: 0,
    };

    const now = new Date();

    mockMilestones.forEach(milestone => {
      // Count by status
      stats.byStatus[milestone.status] = (stats.byStatus[milestone.status] || 0) + 1;

      // Count completed
      if (milestone.status === 'completed') {
        stats.completed++;
      }

      // Check if milestone is upcoming or overdue
      if (milestone.targetDate) {
        const targetDate = new Date(milestone.targetDate);
        if (targetDate > now && milestone.status !== 'completed') {
          stats.upcoming++;
        } else if (targetDate < now && milestone.status !== 'completed') {
          stats.overdue++;
        }
      }
    });

    // Format the response
    return {
      data: {
        project: {
          id: project.id,
          name: project.name,
          description: project.description,
        },
        milestones: mockMilestones,
        stats,
      } as LinearProjectMilestonesResponse,
      isError: false,
    };
  } catch (error) {
    return {
      isError: true,
      errorMessage: typeof error === 'string' ? error : String(error),
      data: null,
    };
  }
};

// Register the resources
registerResource(linearProjectResourceTemplate, linearProjectResourceHandler);
registerResource(linearProjectIssuesResourceTemplate, linearProjectIssuesResourceHandler);
registerResource(linearProjectMilestonesResourceTemplate, linearProjectMilestonesResourceHandler);
