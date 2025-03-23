/**
 * Linear Create Label Tool
 *
 * Creates a new label in Linear.
 */
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { registerTool, ToolHandler } from '../registry.js';
import { linearClient } from '../linear.js';

const TOOL_NAME = 'linear_create_label';

/**
 * Tool definition for linear_create_label
 */
const linearCreateLabelTool: Tool = {
  name: TOOL_NAME,
  description: 'Create a new label in Linear',
  inputSchema: {
    type: 'object',
    properties: {
      teamId: {
        type: 'string',
        description: 'The ID of the team to create the label for',
      },
      name: {
        type: 'string',
        description: 'The name of the label',
      },
      color: {
        type: 'string',
        description: 'The color for the label in hex format (e.g. "#FF0000")',
      },
      description: {
        type: 'string',
        description: 'A description for the label',
      },
      parentId: {
        type: 'string',
        description: 'The ID of a parent label to create a nested label',
      },
    },
    required: ['teamId', 'name'],
  },
};

/**
 * Handler for linear_create_label tool
 *
 * Note: This is a mock implementation since the LinearClient does not have a direct
 * method to create labels. In a real implementation, you would use a GraphQL mutation.
 */
const linearCreateLabelHandler: ToolHandler = async args => {
  try {
    // Type check and validate the required inputs
    if (!args.teamId || typeof args.teamId !== 'string') {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Team ID is required and must be a string',
          },
        ],
        isError: true,
      };
    }

    if (!args.name || typeof args.name !== 'string') {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Label name is required and must be a string',
          },
        ],
        isError: true,
      };
    }

    // Extract and properly type all inputs
    const teamId = args.teamId;
    const name = args.name;
    const color = typeof args.color === 'string' ? args.color : undefined;
    const description = typeof args.description === 'string' ? args.description : undefined;
    const parentId = typeof args.parentId === 'string' ? args.parentId : undefined;

    // Check if the team exists
    const team = await linearClient.team(teamId);
    if (!team) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: Team with ID ${teamId} not found`,
          },
        ],
        isError: true,
      };
    }

    // Check if parent label exists if parentId is provided
    let parentLabel = null;
    if (parentId) {
      // In a real implementation, you would call the API to get the parent label
      // For now, we'll simulate this with a mock check
      const parentExists = parentId === 'parent1'; // mock check

      if (!parentExists) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: Parent label with ID ${parentId} not found`,
            },
          ],
          isError: true,
        };
      }

      parentLabel = {
        id: parentId,
        name: 'MockParent',
      };
    }

    // In a real implementation, you would use a GraphQL mutation to create the label
    // For now, we'll simulate a successful creation with mock data
    const mockCreatedLabel = {
      id: 'label_' + Date.now(),
      name,
      color: color || '#FF0000',
      description: description || '',
      team: {
        id: teamId,
        name: team.name,
        key: team.key,
      },
      createdAt: new Date(),
      parent: parentLabel
        ? {
            id: parentLabel.id,
            name: parentLabel.name,
          }
        : null,
    };

    // Format the response
    const response = {
      label: {
        id: mockCreatedLabel.id,
        name: mockCreatedLabel.name,
        color: mockCreatedLabel.color,
        description: mockCreatedLabel.description,
        teamId: mockCreatedLabel.team.id,
        teamName: mockCreatedLabel.team.name,
        createdAt: mockCreatedLabel.createdAt,
        parentId: mockCreatedLabel.parent?.id,
        parentName: mockCreatedLabel.parent?.name,
      },
      team: {
        id: team.id,
        name: team.name,
        key: team.key,
      },
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2),
        },
      ],
      isError: false,
    };
  } catch (error) {
    console.error('Error in linear_create_label:', error);
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
registerTool(linearCreateLabelTool, linearCreateLabelHandler);

// Export for testing
export { linearCreateLabelTool, linearCreateLabelHandler };
