/**
 * Linear Label Resource
 *
 * Handles the linear-label:// resource which provides access to label details
 */
import { registerResource, ResourceHandler, ResourceResponse, ResourceArgs } from '../registry.js';

// Define interfaces for the mock data
interface MockTeam {
  id: string;
  name: string;
  key: string;
}

interface MockIssue {
  id: string;
  title: string;
  identifier: string;
}

interface MockParent {
  id: string;
  name: string;
}

interface MockLabel {
  id: string;
  name: string;
  color: string;
  description: string;
  team: MockTeam;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
  parent: MockParent | null;
  issues: MockIssue[];
}

interface LabelResponse {
  label: {
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
  };
  team: {
    id: string;
    name: string;
    key: string;
  };
  issues: {
    id: string;
    title: string;
    identifier: string;
  }[];
}

/**
 * Resource handler for linear-label:// URIs
 *
 * Supports:
 * - linear-label:///{labelId}: View label details
 */
const linearLabelResourceHandler: ResourceHandler = async (
  args: ResourceArgs
): Promise<ResourceResponse<LabelResponse>> => {
  try {
    // Get URI from args or use args as URI if it's a string
    const uri = typeof args === 'string' ? args : (args.uri as string);

    if (!uri) {
      return {
        data: null as unknown as LabelResponse,
        isError: true,
        errorMessage: 'No URI provided',
      };
    }

    // Extract the label ID from the URI
    // URI format: linear-label:///{labelId}
    const match = uri.match(/^linear-label:\/\/\/([^/]+)$/);
    if (!match) {
      return {
        data: null as unknown as LabelResponse,
        isError: true,
        errorMessage: `Invalid label URI: ${uri}. Expected format: linear-label:///{labelId}`,
      };
    }

    const labelId = match[1];

    // In a real implementation, you would query the API for the label
    // For now, we'll simulate this with mock data
    const mockLabels: Record<string, MockLabel> = {
      label1: {
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
        issues: [
          { id: 'issue1', title: 'Login page crash', identifier: 'ENG-123' },
          { id: 'issue2', title: 'Signup form validation error', identifier: 'ENG-124' },
        ],
      },
      label2: {
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
        issues: [
          { id: 'issue3', title: 'Add dark mode', identifier: 'ENG-125' },
          { id: 'issue4', title: 'Implement SSO', identifier: 'ENG-126' },
        ],
      },
      label3: {
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
        issues: [{ id: 'issue5', title: 'Redesign homepage', identifier: 'DES-101' }],
      },
      label5: {
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
        issues: [
          { id: 'issue6', title: 'Misaligned buttons', identifier: 'DES-102' },
          { id: 'issue7', title: 'Incorrect icon colors', identifier: 'DES-103' },
        ],
      },
    };

    const label = mockLabels[labelId];
    if (!label) {
      return {
        data: null as unknown as LabelResponse,
        isError: true,
        errorMessage: `Label with ID ${labelId} not found`,
      };
    }

    // Format the response
    const response: LabelResponse = {
      label: {
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
      },
      team: {
        id: label.team.id,
        name: label.team.name,
        key: label.team.key,
      },
      issues: label.issues.map(issue => ({
        id: issue.id,
        title: issue.title,
        identifier: issue.identifier,
      })),
    };

    return {
      data: response,
    };
  } catch (error) {
    console.error('Error in linear-label resource:', error);
    return {
      data: null as unknown as LabelResponse,
      isError: true,
      errorMessage: `Error: ${(error as Error).message || String(error)}`,
    };
  }
};

// Define the resource object
const linearLabelResource = {
  uri: 'linear-label',
  name: 'Linear Label',
  description: 'View details for a Linear label',
};

// Register the resource handler
registerResource(linearLabelResource, linearLabelResourceHandler);

// Export for testing
export { linearLabelResourceHandler };
