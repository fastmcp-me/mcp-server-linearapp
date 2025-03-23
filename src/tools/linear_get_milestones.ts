/**
 * Linear Get Milestones Tool
 *
 * This tool returns milestones for a project or organization.
 *
 * Optional parameters:
 * - projectId (string): Filter milestones by project
 * - includeArchived (boolean): Include archived milestones
 * - limit (number, default: 50): Maximum number of milestones to return
 */
import { registerTool, ToolArgs } from '../registry.js';

interface MilestoneData {
  id: string;
  name: string;
  description: string;
  targetDate: string | null;
  status: string;
  sortOrder: number;
  projectId: string;
  projectName: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

// Define the tool
export const linearGetMilestonesTool = {
  name: 'linear_get_milestones',
  description: 'Get milestones for a project or organization',
  inputSchema: {
    type: 'object' as const,
    properties: {
      projectId: {
        type: 'string',
        description:
          'Project ID to filter milestones by. If not provided, returns milestones across all projects.',
      },
      includeArchived: {
        type: 'boolean',
        description: 'Include archived milestones',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of milestones to return',
      },
    },
    required: [],
  },
};

// Tool handler implementation
export const linearGetMilestonesHandler = async (
  args: ToolArgs
): Promise<{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}> => {
  try {
    // Extract parameters with proper type checking
    const projectId = typeof args.projectId === 'string' ? args.projectId : undefined;
    const includeArchived =
      typeof args.includeArchived === 'boolean' ? args.includeArchived : false;
    const limit = typeof args.limit === 'number' ? args.limit : 50;

    // For simulation purposes, we'll create mock response data
    // In a real implementation, this would call the Linear GraphQL API

    // First check if we need to verify the project exists
    if (projectId) {
      // Simulate checking if project exists
      const mockProject = {
        id: projectId,
        name: projectId === 'project1' ? 'Mobile App' : 'Website Redesign',
        exists: ['project1', 'project2'].includes(projectId),
      };

      if (!mockProject.exists) {
        throw new Error(`Project with ID ${projectId} not found`);
      }
    }

    // Mock milestone data
    const allMilestones: MilestoneData[] = [
      {
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
      },
      {
        id: 'milestone2',
        name: 'Beta Release',
        description: 'Public beta testing phase',
        targetDate: '2023-08-01',
        status: 'in_progress',
        sortOrder: 2,
        projectId: 'project1',
        projectName: 'Mobile App',
        createdAt: '2023-01-15T12:10:00Z',
        updatedAt: '2023-07-10T11:45:00Z',
        archivedAt: null,
      },
      {
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
      },
      {
        id: 'milestone4',
        name: 'Design Phase',
        description: 'Complete all UI/UX designs',
        targetDate: '2023-07-15',
        status: 'completed',
        sortOrder: 1,
        projectId: 'project2',
        projectName: 'Website Redesign',
        createdAt: '2023-03-01T09:00:00Z',
        updatedAt: '2023-07-20T16:30:00Z',
        archivedAt: null,
      },
      {
        id: 'milestone5',
        name: 'Development Phase',
        description: 'Implement designs in code',
        targetDate: '2023-09-15',
        status: 'in_progress',
        sortOrder: 2,
        projectId: 'project2',
        projectName: 'Website Redesign',
        createdAt: '2023-03-01T09:15:00Z',
        updatedAt: '2023-08-05T14:20:00Z',
        archivedAt: null,
      },
      {
        id: 'milestone6',
        name: 'Old Milestone',
        description: 'Legacy milestone',
        targetDate: '2022-12-01',
        status: 'completed',
        sortOrder: 0,
        projectId: 'project1',
        projectName: 'Mobile App',
        createdAt: '2022-09-01T10:00:00Z',
        updatedAt: '2022-12-05T11:30:00Z',
        archivedAt: '2023-01-01T00:00:00Z',
      },
    ];

    // Filter milestones based on parameters
    let filteredMilestones = allMilestones.filter(milestone => {
      // Filter by project if specified
      if (projectId && milestone.projectId !== projectId) {
        return false;
      }

      // Filter out archived milestones unless includeArchived is true
      if (!includeArchived && milestone.archivedAt !== null) {
        return false;
      }

      return true;
    });

    // Apply limit
    filteredMilestones = filteredMilestones.slice(0, limit);

    // Format the response
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              milestones: filteredMilestones,
              pageInfo: {
                hasNextPage: filteredMilestones.length === limit,
                endCursor:
                  filteredMilestones.length > 0
                    ? filteredMilestones[filteredMilestones.length - 1].id
                    : null,
              },
              totalCount: filteredMilestones.length,
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    console.error('Error in linear_get_milestones:', error);
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${(error as Error).message || String(error)}`,
        },
      ],
      isError: true,
    };
  }
};

// Register the tool
registerTool(linearGetMilestonesTool, linearGetMilestonesHandler);
