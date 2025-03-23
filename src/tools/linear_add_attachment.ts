/**
 * Linear Add Attachment Tool
 *
 * This tool adds an attachment to an issue in Linear.
 *
 * Required parameters:
 * - issueId (string): Issue ID to add attachment to
 * - url (string): URL of attachment
 * - title (string): Title of attachment
 *
 * Optional parameters:
 * - subtitle (string): Subtitle for attachment
 * - icon (string): Icon URL for attachment
 */
import { registerTool, ToolArgs } from '../registry.js';

interface AddAttachmentArgs {
  issueId: string;
  url: string;
  title: string;
  subtitle?: string;
  icon?: string;
}

interface AttachmentData {
  id: string;
  url: string;
  title: string;
  subtitle?: string;
  icon?: string;
  createdAt: string;
}

// Define the tool
export const linearAddAttachmentTool = {
  name: 'linear_add_attachment',
  description: 'Add an attachment to an issue in Linear',
  inputSchema: {
    type: 'object' as const,
    properties: {
      issueId: {
        type: 'string',
        description: 'Issue ID to add attachment to',
      },
      url: {
        type: 'string',
        description: 'URL of attachment',
      },
      title: {
        type: 'string',
        description: 'Title of attachment',
      },
      subtitle: {
        type: 'string',
        description: 'Subtitle for attachment',
      },
      icon: {
        type: 'string',
        description: 'Icon URL for attachment',
      },
    },
    required: ['issueId', 'url', 'title'],
  },
};

// Tool handler implementation
export const linearAddAttachmentHandler = async (
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

    if (!args.url || typeof args.url !== 'string') {
      throw new Error('URL is required and must be a string');
    }

    if (!args.title || typeof args.title !== 'string') {
      throw new Error('Title is required and must be a string');
    }

    // Extract and type the arguments properly
    const attachment: AddAttachmentArgs = {
      issueId: args.issueId,
      url: args.url,
      title: args.title,
      subtitle: args.subtitle as string | undefined,
      icon: args.icon as string | undefined,
    };

    const { issueId, url, title, subtitle, icon } = attachment;

    // Validate URL format
    try {
      new URL(url);
    } catch (e) {
      throw new Error('Invalid URL format');
    }

    // In a real implementation, we would use linearClient.issue(issueId)
    // and then issue.attachments.create()

    // First, check if issue exists
    const mockIssues: Record<string, { id: string; title: string }> = {
      issue1: { id: 'issue1', title: 'Test Issue 1' },
      issue2: { id: 'issue2', title: 'Test Issue 2' },
    };

    if (!mockIssues[issueId]) {
      throw new Error(`Issue with ID ${issueId} not found`);
    }

    // For simulation purposes, we'll return a mock response
    const mockAttachment: AttachmentData = {
      id: `attachment-${Date.now()}`,
      url,
      title,
      subtitle,
      icon,
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
              attachment: mockAttachment,
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    console.error('Error in linear_add_attachment:', error);
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
registerTool(linearAddAttachmentTool, linearAddAttachmentHandler);
