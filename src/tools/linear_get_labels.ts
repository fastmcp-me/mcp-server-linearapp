/**
 * Linear Get Labels Tool
 *
 * Retrieves labels from Linear, optionally filtered by team.
 */
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { registerTool, ToolHandler } from '../registry.js';
import { linearClient } from '../linear.js';

/**
 * Interface for mock label data structure
 */
interface MockLabel {
  id: string;
  name: string;
  color: string;
  description: string;
  team: {
    id: string;
    name: string;
    key: string;
  };
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
  parent: {
    id: string;
    name: string;
  } | null;
}

interface LabelResponseData {
  id: string;
  name: string;
  color: string;
  description: string;
  teamId: string;
  teamName: string;
  teamKey: string;
  createdAt: Date;
  updatedAt: Date;
  archived: boolean;
  archivedAt: Date | null;
  parentId: string | null;
  parentName: string | null;
}

interface LabelsResponse {
  labels: LabelResponseData[];
  pagination: {
    hasMore: boolean;
    limit: number;
    totalCount: number;
  };
  team?: {
    id: string;
    name: string;
    key: string;
  };
}

const TOOL_NAME = 'linear_get_labels';

/**
 * Tool definition for linear_get_labels
 */
const linearGetLabelsTool: Tool = {
  name: TOOL_NAME,
  description: 'Get labels from Linear, optionally filtered by team',
  inputSchema: {
    type: 'object',
    properties: {
      teamId: {
        type: 'string',
        description: 'Filter labels by team ID',
      },
      includeArchived: {
        type: 'boolean',
        description: 'Whether to include archived labels',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of labels to return',
      },
    },
  },
};

/**
 * Handler for linear_get_labels tool
 *
 * Note: This is a mock implementation since the LinearClient does not have a direct
 * method to fetch multiple labels. In a real implementation, you would use a GraphQL query.
 */
const linearGetLabelsHandler: ToolHandler = async args => {
  try {
    // Extract optional arguments
    const teamId = typeof args.teamId === 'string' ? args.teamId : undefined;
    const includeArchived =
      typeof args.includeArchived === 'boolean' ? args.includeArchived : false;
    const limit = typeof args.limit === 'number' ? args.limit : 50;

    // If teamId is provided, check that the team exists
    if (teamId) {
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
    }

    // In a real implementation, you would query the API for labels
    // For now, we'll use mock data
    const mockLabels: MockLabel[] = [
      {
        id: 'label1',
        name: 'Bug',
        color: '#FF0000',
        description: 'Software bug',
        team: {
          id: 'team1',
          name: 'Engineering',
          key: 'ENG',
        },
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
        archivedAt: null,
        parent: null,
      },
      {
        id: 'label2',
        name: 'Feature',
        color: '#00FF00',
        description: 'New feature request',
        team: {
          id: 'team1',
          name: 'Engineering',
          key: 'ENG',
        },
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
        archivedAt: null,
        parent: null,
      },
      {
        id: 'label3',
        name: 'UI',
        color: '#0000FF',
        description: 'User interface',
        team: {
          id: 'team2',
          name: 'Design',
          key: 'DES',
        },
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
        archivedAt: null,
        parent: null,
      },
      {
        id: 'label4',
        name: 'Archived Label',
        color: '#CCCCCC',
        description: 'This is archived',
        team: {
          id: 'team1',
          name: 'Engineering',
          key: 'ENG',
        },
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
        archivedAt: new Date('2023-02-01'),
        parent: null,
      },
      {
        id: 'label5',
        name: 'UI Bug',
        color: '#FF00FF',
        description: 'Bug in the UI',
        team: {
          id: 'team2',
          name: 'Design',
          key: 'DES',
        },
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
        archivedAt: null,
        parent: {
          id: 'label3',
          name: 'UI',
        },
      },
    ];

    // Filter labels based on provided arguments
    let filteredLabels = mockLabels;

    // Filter by team if teamId is provided
    if (teamId) {
      filteredLabels = filteredLabels.filter(label => label.team.id === teamId);
    }

    // Filter out archived labels if includeArchived is false
    if (!includeArchived) {
      filteredLabels = filteredLabels.filter(label => label.archivedAt === null);
    }

    // Apply limit
    filteredLabels = filteredLabels.slice(0, Math.min(filteredLabels.length, limit));

    // Map to response format
    const labelsResponse = filteredLabels.map(label => ({
      id: label.id,
      name: label.name,
      color: label.color,
      description: label.description,
      teamId: label.team.id,
      teamName: label.team.name,
      teamKey: label.team.key,
      createdAt: label.createdAt,
      updatedAt: label.updatedAt,
      archived: label.archivedAt !== null,
      archivedAt: label.archivedAt,
      parentId: label.parent?.id || null,
      parentName: label.parent?.name || null,
    }));

    // Prepare the response
    const response: LabelsResponse = {
      labels: labelsResponse,
      pagination: {
        hasMore: false,
        limit,
        totalCount: filteredLabels.length,
      },
    };

    // If teamId was provided, include team info
    if (teamId) {
      const teamInfo = filteredLabels.length > 0 ? filteredLabels[0].team : null;
      if (teamInfo) {
        response.team = {
          id: teamInfo.id,
          name: teamInfo.name,
          key: teamInfo.key,
        };
      }
    }

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
    console.error('Error in linear_get_labels:', error);
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
registerTool(linearGetLabelsTool, linearGetLabelsHandler);

// Export for testing
export { linearGetLabelsTool, linearGetLabelsHandler };
