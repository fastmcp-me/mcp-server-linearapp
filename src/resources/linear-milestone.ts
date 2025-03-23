/**
 * Linear Milestone Resource
 *
 * Handles the linear-milestone:// resource which provides access to milestone details
 */
import { registerResource, ResourceHandler, ResourceResponse, ResourceArgs } from '../registry.js';

// Define interfaces for the mock data
interface MockIssue {
  id: string;
  title: string;
  identifier: string;
  status: string;
  priority: number;
  assignee: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface MockMilestone {
  id: string;
  name: string;
  description: string;
  targetDate: string;
  status: string;
  sortOrder: number;
  projectId: string;
  projectName: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  issues: MockIssue[];
}

interface MilestoneResponse {
  milestone: {
    id: string;
    name: string;
    description: string;
    targetDate: string;
    status: string;
    sortOrder: number;
    projectId: string;
    projectName: string;
    createdAt: string;
    updatedAt: string;
    archivedAt: string | null;
  };
  project: {
    id: string;
    name: string;
  };
  issues: {
    id: string;
    title: string;
    identifier: string;
    status: string;
    priority: number;
    assignee: {
      id: string;
      name: string;
      email: string;
    } | null;
  }[];
  stats: {
    totalIssues: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    percentComplete: number;
  };
}

/**
 * Resource handler for linear-milestone:// URIs
 *
 * Supports:
 * - linear-milestone:///{milestoneId}: View milestone details
 */
const linearMilestoneResourceHandler: ResourceHandler = async (
  args: ResourceArgs
): Promise<ResourceResponse<MilestoneResponse>> => {
  try {
    // Get URI from args or use args as URI if it's a string
    const uri = typeof args === 'string' ? args : (args.uri as string);

    if (!uri) {
      return {
        data: null as unknown as MilestoneResponse,
        isError: true,
        errorMessage: 'No URI provided',
      };
    }

    // Extract the milestone ID from the URI
    // URI format: linear-milestone:///{milestoneId}
    const match = uri.match(/^linear-milestone:\/\/\/([^/]+)$/);
    if (!match) {
      return {
        data: null as unknown as MilestoneResponse,
        isError: true,
        errorMessage: `Invalid milestone URI: ${uri}. Expected format: linear-milestone:///{milestoneId}`,
      };
    }

    const milestoneId = match[1];

    // In a real implementation, you would query the API for the milestone
    // For now, we'll simulate this with mock data
    const mockMilestones: Record<string, MockMilestone> = {
      milestone1: {
        id: 'milestone1',
        name: 'Alpha Release',
        description: 'Initial feature-complete release for internal testing',
        targetDate: '2023-06-15',
        status: 'completed',
        sortOrder: 1,
        projectId: 'project1',
        projectName: 'Mobile App',
        createdAt: '2023-01-15T12:00:00Z',
        updatedAt: '2023-06-18T09:30:00Z',
        archivedAt: null,
        issues: [
          {
            id: 'issue1',
            title: 'Implement user authentication',
            identifier: 'MOB-101',
            status: 'completed',
            priority: 1,
            assignee: {
              id: 'user1',
              name: 'Jane Doe',
              email: 'jane@example.com',
            },
          },
          {
            id: 'issue2',
            title: 'Design login screen',
            identifier: 'MOB-102',
            status: 'completed',
            priority: 2,
            assignee: {
              id: 'user2',
              name: 'John Smith',
              email: 'john@example.com',
            },
          },
          {
            id: 'issue3',
            title: 'Setup CI/CD pipeline',
            identifier: 'MOB-103',
            status: 'completed',
            priority: 1,
            assignee: null,
          },
        ],
      },
      milestone2: {
        id: 'milestone2',
        name: 'Beta Release',
        description: 'Public beta testing phase',
        targetDate: '2023-08-01',
        status: 'inProgress',
        sortOrder: 2,
        projectId: 'project1',
        projectName: 'Mobile App',
        createdAt: '2023-01-15T12:10:00Z',
        updatedAt: '2023-07-10T11:45:00Z',
        archivedAt: null,
        issues: [
          {
            id: 'issue4',
            title: 'Fix crash on startup',
            identifier: 'MOB-104',
            status: 'completed',
            priority: 0,
            assignee: {
              id: 'user1',
              name: 'Jane Doe',
              email: 'jane@example.com',
            },
          },
          {
            id: 'issue5',
            title: 'Implement dark mode',
            identifier: 'MOB-105',
            status: 'inProgress',
            priority: 3,
            assignee: {
              id: 'user2',
              name: 'John Smith',
              email: 'john@example.com',
            },
          },
          {
            id: 'issue6',
            title: 'Add user feedback form',
            identifier: 'MOB-106',
            status: 'todo',
            priority: 2,
            assignee: null,
          },
        ],
      },
      milestone3: {
        id: 'milestone3',
        name: 'Final Release',
        description: 'Production launch',
        targetDate: '2023-09-30',
        status: 'planned',
        sortOrder: 3,
        projectId: 'project1',
        projectName: 'Mobile App',
        createdAt: '2023-01-15T12:20:00Z',
        updatedAt: '2023-01-15T12:20:00Z',
        archivedAt: null,
        issues: [
          {
            id: 'issue7',
            title: 'Performance optimization',
            identifier: 'MOB-107',
            status: 'todo',
            priority: 2,
            assignee: null,
          },
          {
            id: 'issue8',
            title: 'Final security audit',
            identifier: 'MOB-108',
            status: 'todo',
            priority: 1,
            assignee: null,
          },
        ],
      },
    };

    const milestone = mockMilestones[milestoneId];
    if (!milestone) {
      return {
        data: null as unknown as MilestoneResponse,
        isError: true,
        errorMessage: `Milestone with ID ${milestoneId} not found`,
      };
    }

    // Calculate milestone stats
    const totalIssues = milestone.issues.length;
    const completed = milestone.issues.filter(issue => issue.status === 'completed').length;
    const inProgress = milestone.issues.filter(issue => issue.status === 'inProgress').length;
    const notStarted = milestone.issues.filter(issue =>
      ['todo', 'backlog'].includes(issue.status)
    ).length;
    const percentComplete = totalIssues > 0 ? Math.round((completed / totalIssues) * 100) : 0;

    // Format the response
    const response: MilestoneResponse = {
      milestone: {
        id: milestone.id,
        name: milestone.name,
        description: milestone.description,
        targetDate: milestone.targetDate,
        status: milestone.status,
        sortOrder: milestone.sortOrder,
        projectId: milestone.projectId,
        projectName: milestone.projectName,
        createdAt: milestone.createdAt,
        updatedAt: milestone.updatedAt,
        archivedAt: milestone.archivedAt,
      },
      project: {
        id: milestone.projectId,
        name: milestone.projectName,
      },
      issues: milestone.issues,
      stats: {
        totalIssues,
        completed,
        inProgress,
        notStarted,
        percentComplete,
      },
    };

    return {
      data: response,
    };
  } catch (error) {
    console.error('Error in linear-milestone resource:', error);
    return {
      data: null as unknown as MilestoneResponse,
      isError: true,
      errorMessage: `Error: ${(error as Error).message || String(error)}`,
    };
  }
};

// Define the resource object
const linearMilestoneResource = {
  uri: 'linear-milestone',
  name: 'Linear Milestone',
  description: 'View details for a Linear milestone',
};

// Register the resource handler
registerResource(linearMilestoneResource, linearMilestoneResourceHandler);

// Export for testing
export { linearMilestoneResourceHandler };
