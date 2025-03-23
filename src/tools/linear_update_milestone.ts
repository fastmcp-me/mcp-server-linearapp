/**
 * Linear Update Milestone Tool
 *
 * This tool updates an existing milestone in Linear.
 *
 * Required parameters:
 * - id (string): Milestone ID to update
 *
 * Optional parameters:
 * - name (string): New milestone name
 * - targetDate (string): New target date (ISO format)
 * - description (string): New milestone description
 * - status (string): New milestone status (e.g., 'planned', 'inProgress', 'completed')
 * - sortOrder (number): New position in milestone list
 */
import { registerTool, ToolArgs } from '../registry.js';

interface UpdateMilestoneArgs {
  id: string;
  name?: string;
  targetDate?: string;
  description?: string;
  status?: string;
  sortOrder?: number;
}

interface MilestoneData {
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
  archivedAt: null | string;
}

// Define the tool
export const linearUpdateMilestoneTool = {
  name: 'linear_update_milestone',
  description: 'Update an existing milestone in Linear',
  inputSchema: {
    type: 'object' as const,
    properties: {
      id: {
        type: 'string',
        description: 'Milestone ID to update',
      },
      name: {
        type: 'string',
        description: 'New milestone name',
      },
      targetDate: {
        type: 'string',
        description: 'New target date (ISO format, e.g., "2023-12-31")',
      },
      description: {
        type: 'string',
        description: 'New milestone description',
      },
      status: {
        type: 'string',
        description: 'New milestone status (e.g., "planned", "inProgress", "completed")',
      },
      sortOrder: {
        type: 'number',
        description: 'New position in milestone list',
      },
    },
    required: ['id'],
  },
};

// Tool handler implementation
export const linearUpdateMilestoneHandler = async (
  args: ToolArgs
): Promise<{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}> => {
  try {
    // Type check and validate the required input
    if (!args.id || typeof args.id !== 'string') {
      throw new Error('Milestone ID is required and must be a string');
    }

    // Extract and type the arguments properly
    const milestoneUpdate: UpdateMilestoneArgs = {
      id: args.id,
      name: typeof args.name === 'string' ? args.name : undefined,
      targetDate: typeof args.targetDate === 'string' ? args.targetDate : undefined,
      description: typeof args.description === 'string' ? args.description : undefined,
      status: typeof args.status === 'string' ? args.status : undefined,
      sortOrder: typeof args.sortOrder === 'number' ? args.sortOrder : undefined,
    };

    const { id, name, targetDate, description, status, sortOrder } = milestoneUpdate;

    // Validate that at least one update field is provided
    if (!name && !targetDate && !description && !status && sortOrder === undefined) {
      throw new Error('At least one field to update must be provided');
    }

    // Validate date format if provided
    if (targetDate) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(targetDate)) {
        throw new Error('Target date must be in ISO format (YYYY-MM-DD)');
      }
    }

    // Validate status if provided
    if (status && !['planned', 'inProgress', 'completed'].includes(status)) {
      throw new Error('Status must be one of: "planned", "inProgress", "completed"');
    }

    // Mock milestone data for simulation
    const mockMilestones: Record<string, MilestoneData> = {
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
      },
    };

    // Check if milestone exists
    const milestone = mockMilestones[id];
    if (!milestone) {
      throw new Error(`Milestone with ID ${id} not found`);
    }

    // In a real implementation, this would call the Linear GraphQL API
    // to update the milestone
    // For simulation purposes, we'll return updated mock data

    // Create updated milestone
    const updatedMilestone = {
      ...milestone,
      name: name !== undefined ? name : milestone.name,
      description: description !== undefined ? description : milestone.description,
      targetDate: targetDate !== undefined ? targetDate : milestone.targetDate,
      status: status !== undefined ? status : milestone.status,
      sortOrder: sortOrder !== undefined ? sortOrder : milestone.sortOrder,
      updatedAt: new Date().toISOString(),
    };

    // Format the response
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              milestone: updatedMilestone,
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    console.error('Error in linear_update_milestone:', error);
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
registerTool(linearUpdateMilestoneTool, linearUpdateMilestoneHandler);
