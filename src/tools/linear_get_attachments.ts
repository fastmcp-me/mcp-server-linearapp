/**
 * Linear Get Attachments Tool
 *
 * This tool retrieves attachments for an issue in Linear.
 *
 * Required parameters:
 * - issueId (string): Issue ID to get attachments for
 */
import { registerTool, ToolArgs } from '../registry.js';

interface AttachmentData {
  id: string;
  url: string;
  title: string;
  subtitle?: string;
  icon?: string;
  createdAt: string;
}

// Define the tool
export const linearGetAttachmentsTool = {
  name: 'linear_get_attachments',
  description: 'Get attachments for an issue in Linear',
  inputSchema: {
    type: 'object' as const,
    properties: {
      issueId: {
        type: 'string',
        description: 'Issue ID to get attachments for',
      },
    },
    required: ['issueId'],
  },
};

// Tool handler implementation
export const linearGetAttachmentsHandler = async (
  args: ToolArgs
): Promise<{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}> => {
  try {
    // Type check and validate the input
    if (!args.issueId || typeof args.issueId !== 'string') {
      throw new Error('Issue ID is required and must be a string');
    }

    // Extract the issueId
    const issueId = args.issueId;

    // In a real implementation, we would use linearClient.issue(issueId)
    // and then issue.attachments()

    // First, check if issue exists
    const mockIssues: Record<string, { id: string; title: string; attachments: AttachmentData[] }> =
      {
        issue1: {
          id: 'issue1',
          title: 'Test Issue 1',
          attachments: [
            {
              id: 'attachment1',
              url: 'https://example.com/doc1.pdf',
              title: 'Requirements Document',
              subtitle: 'Project requirements',
              icon: 'https://example.com/pdf-icon.png',
              createdAt: '2023-03-01T12:00:00Z',
            },
            {
              id: 'attachment2',
              url: 'https://example.com/design.png',
              title: 'Design Mockup',
              subtitle: 'UI design',
              icon: 'https://example.com/image-icon.png',
              createdAt: '2023-03-02T14:30:00Z',
            },
          ],
        },
        issue2: {
          id: 'issue2',
          title: 'Test Issue 2',
          attachments: [
            {
              id: 'attachment3',
              url: 'https://example.com/spec.pdf',
              title: 'Technical Specification',
              createdAt: '2023-03-03T09:15:00Z',
            },
          ],
        },
        issue3: {
          id: 'issue3',
          title: 'Test Issue 3',
          attachments: [],
        },
      };

    if (!mockIssues[issueId]) {
      throw new Error(`Issue with ID ${issueId} not found`);
    }

    const attachments = mockIssues[issueId].attachments;

    // Format the response
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              issueId,
              issueTitle: mockIssues[issueId].title,
              attachments,
              totalCount: attachments.length,
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    console.error('Error in linear_get_attachments:', error);
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
registerTool(linearGetAttachmentsTool, linearGetAttachmentsHandler);
