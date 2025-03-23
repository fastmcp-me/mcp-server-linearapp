/**
 * Linear Link Issues Tool
 *
 * This tool creates a relationship between issues in Linear.
 *
 * Required parameters:
 * - issueId (string): Source issue ID
 * - relatedIssueId (string): Target issue ID
 * - type (string): Relationship type (e.g., "blocks", "related", "duplicate")
 */
import { registerTool, ToolArgs } from '../registry.js';

interface IssueRelationData {
  id: string;
  type: string;
  sourceIssueId: string;
  targetIssueId: string;
  createdAt: string;
}

// Define the tool
export const linearLinkIssuesTool = {
  name: 'linear_link_issues',
  description: 'Create a relationship between issues in Linear',
  inputSchema: {
    type: 'object' as const,
    properties: {
      issueId: {
        type: 'string',
        description: 'Source issue ID',
      },
      relatedIssueId: {
        type: 'string',
        description: 'Target issue ID',
      },
      type: {
        type: 'string',
        description: 'Relationship type (e.g., "blocks", "related", "duplicate")',
      },
    },
    required: ['issueId', 'relatedIssueId', 'type'],
  },
};

// Tool handler implementation
export const linearLinkIssuesHandler = async (
  args: ToolArgs
): Promise<{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}> => {
  try {
    // Type check and validate the required inputs
    if (!args.issueId || typeof args.issueId !== 'string') {
      throw new Error('Source issue ID is required and must be a string');
    }

    if (!args.relatedIssueId || typeof args.relatedIssueId !== 'string') {
      throw new Error('Target issue ID is required and must be a string');
    }

    if (!args.type || typeof args.type !== 'string') {
      throw new Error('Relationship type is required and must be a string');
    }

    // Extract and type the arguments properly
    const issueId = args.issueId;
    const relatedIssueId = args.relatedIssueId;
    const type = args.type;

    // Validate relationship type
    const validTypes = [
      'blocks',
      'related',
      'duplicate',
      'blocked_by',
      'relates_to',
      'duplicates',
      'is_duplicated_by',
    ];
    if (!validTypes.includes(type.toLowerCase())) {
      throw new Error(`Invalid relationship type. Must be one of: ${validTypes.join(', ')}`);
    }

    // Check if issues exist (mock implementation)
    const mockIssues: Record<string, { id: string; title: string; identifier: string }> = {
      issue1: { id: 'issue1', title: 'Test Issue 1', identifier: 'ABC-123' },
      issue2: { id: 'issue2', title: 'Test Issue 2', identifier: 'ABC-124' },
      issue3: { id: 'issue3', title: 'Test Issue 3', identifier: 'ABC-125' },
    };

    if (!mockIssues[issueId]) {
      throw new Error(`Source issue with ID ${issueId} not found`);
    }

    if (!mockIssues[relatedIssueId]) {
      throw new Error(`Target issue with ID ${relatedIssueId} not found`);
    }

    // Check if issues are the same
    if (issueId === relatedIssueId) {
      throw new Error('Cannot create a relationship between an issue and itself');
    }

    // For simulation purposes, we'll return a mock response
    const mockRelation: IssueRelationData = {
      id: `relation-${Date.now()}`,
      type: type.toLowerCase(),
      sourceIssueId: issueId,
      targetIssueId: relatedIssueId,
      createdAt: new Date().toISOString(),
    };

    // Format the response
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              relation: mockRelation,
              sourceIssue: {
                id: mockIssues[issueId].id,
                title: mockIssues[issueId].title,
                identifier: mockIssues[issueId].identifier,
              },
              targetIssue: {
                id: mockIssues[relatedIssueId].id,
                title: mockIssues[relatedIssueId].title,
                identifier: mockIssues[relatedIssueId].identifier,
              },
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    console.error('Error in linear_link_issues:', error);
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
registerTool(linearLinkIssuesTool, linearLinkIssuesHandler);
