/**
 * Linear Create Milestone Tool
 *
 * This tool creates a new milestone in Linear.
 *
 * Required parameters:
 * - name (string): Milestone name
 * - projectId (string): Project ID to create milestone in
 * - targetDate (string): Target completion date (ISO format)
 *
 * Optional parameters:
 * - description (string): Milestone description
 * - sortOrder (number): Position in milestone list
 */
import { registerTool, ToolArgs } from '../registry.js';

interface CreateMilestoneArgs {
  name: string;
  projectId: string;
  targetDate: string;
  description?: string;
  sortOrder?: number;
}

// Define the tool
export const linearCreateMilestoneTool = {
  name: 'linear_create_milestone',
  description: 'Create a new milestone in Linear',
  inputSchema: {
    type: 'object' as const,
    properties: {
      name: {
        type: 'string',
        description: 'Milestone name',
      },
      projectId: {
        type: 'string',
        description: 'Project ID to create milestone in',
      },
      targetDate: {
        type: 'string',
        description: 'Target completion date (ISO format, e.g., "2023-12-31")',
      },
      description: {
        type: 'string',
        description: 'Milestone description',
      },
      sortOrder: {
        type: 'number',
        description: 'Position in milestone list',
      },
    },
    required: ['name', 'projectId', 'targetDate'],
  },
};

// Tool handler implementation
export const linearCreateMilestoneHandler = async (
  args: ToolArgs
): Promise<{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}> => {
  try {
    // Type check and validate the required inputs
    if (!args.name || typeof args.name !== 'string') {
      throw new Error('Milestone name is required and must be a string');
    }

    if (!args.projectId || typeof args.projectId !== 'string') {
      throw new Error('Project ID is required and must be a string');
    }

    if (!args.targetDate || typeof args.targetDate !== 'string') {
      throw new Error('Target date is required and must be a string');
    }

    // Extract and type the arguments properly
    const milestone: CreateMilestoneArgs = {
      name: args.name,
      projectId: args.projectId,
      targetDate: args.targetDate,
      description: args.description as string | undefined,
      sortOrder: args.sortOrder as number | undefined,
    };

    const { name, projectId, targetDate, description, sortOrder } = milestone;

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(targetDate)) {
      throw new Error('Target date must be in ISO format (YYYY-MM-DD)');
    }

    // Simulate checking if project exists
    const mockProject = {
      id: projectId,
      name: projectId === 'project1' ? 'Mobile App' : 'Website Redesign',
      exists: ['project1', 'project2'].includes(projectId),
    };

    if (!mockProject.exists) {
      throw new Error(`Project with ID ${projectId} not found`);
    }

    // In a real implementation, this would call the Linear GraphQL API
    // to create a new milestone
    // For simulation purposes, we'll return mock data

    // Generate a new milestone ID
    const milestoneId = `milestone${Math.floor(Math.random() * 10000)}`;

    // Create a new milestone object
    const createdMilestone = {
      id: milestoneId,
      name,
      description: description || '',
      targetDate,
      status: 'planned',
      sortOrder: sortOrder || 0,
      projectId,
      projectName: mockProject.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archivedAt: null,
    };

    // Format the response
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              milestone: createdMilestone,
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    console.error('Error in linear_create_milestone:', error);
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
registerTool(linearCreateMilestoneTool, linearCreateMilestoneHandler);
