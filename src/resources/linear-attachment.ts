import { registerResource, ResourceHandler, ResourceResponse, ResourceArgs } from '../registry.js';

// Define interfaces for the mock data
interface Attachment {
  id: string;
  url: string;
  title: string;
  subtitle?: string;
  source?: string;
  createdAt: string;
  updatedAt: string;
}

interface Issue {
  id: string;
  title: string;
  identifier: string;
}

interface AttachmentResponseData {
  attachment: Attachment;
  issue: Issue;
}

// Define mock data for attachments
const mockAttachments: Record<string, Attachment> = {
  attachment1: {
    id: 'attachment1',
    url: 'https://example.com/doc1.pdf',
    title: 'Requirements Document',
    subtitle: 'Project requirements',
    source: 'Manual upload',
    createdAt: '2023-08-01T12:00:00Z',
    updatedAt: '2023-08-01T12:00:00Z',
  },
  attachment2: {
    id: 'attachment2',
    url: 'https://example.com/design.png',
    title: 'Design Mockup',
    source: 'Figma',
    createdAt: '2023-08-02T14:30:00Z',
    updatedAt: '2023-08-02T14:30:00Z',
  },
  attachment3: {
    id: 'attachment3',
    url: 'https://example.com/spec.pdf',
    title: 'Technical Specification',
    source: 'Google Drive',
    createdAt: '2023-08-03T09:15:00Z',
    updatedAt: '2023-08-03T09:15:00Z',
  },
};

// Define mock data for issues with attachments
const mockIssuesWithAttachments: Record<string, { issue: Issue; attachmentIds: string[] }> = {
  attachment1: {
    issue: {
      id: 'issue1',
      title: 'Test Issue 1',
      identifier: 'PROJ-123',
    },
    attachmentIds: ['attachment1', 'attachment2'],
  },
  attachment2: {
    issue: {
      id: 'issue1',
      title: 'Test Issue 1',
      identifier: 'PROJ-123',
    },
    attachmentIds: ['attachment1', 'attachment2'],
  },
  attachment3: {
    issue: {
      id: 'issue2',
      title: 'Test Issue 2',
      identifier: 'PROJ-456',
    },
    attachmentIds: ['attachment3'],
  },
};

export const linearAttachmentResourceHandler: ResourceHandler = async (
  args: ResourceArgs
): Promise<ResourceResponse<AttachmentResponseData>> => {
  try {
    // Extract URI from args
    const uri = args.uri as string;
    if (!uri) {
      return {
        data: null as unknown as AttachmentResponseData,
        isError: true,
        errorMessage: 'URI is required',
      };
    }

    // Check if the URI is valid for an attachment
    const match = uri.match(/^linear-attachment:\/\/\/([^/]+)$/);
    if (!match) {
      return {
        data: null as unknown as AttachmentResponseData,
        isError: true,
        errorMessage: 'Invalid URI format',
      };
    }

    const attachmentId = match[1];

    // Find the attachment
    const attachment = mockAttachments[attachmentId];
    if (!attachment) {
      return {
        data: null as unknown as AttachmentResponseData,
        isError: true,
        errorMessage: `Attachment with ID ${attachmentId} not found`,
      };
    }

    // Find the issue associated with this attachment
    const issueData = mockIssuesWithAttachments[attachmentId];
    if (!issueData) {
      return {
        data: null as unknown as AttachmentResponseData,
        isError: true,
        errorMessage: `No issue found for attachment ${attachmentId}`,
      };
    }

    return {
      data: {
        attachment,
        issue: issueData.issue,
      },
    };
  } catch (error) {
    console.error('Error in linear-attachment resource:', error);
    return {
      data: null as unknown as AttachmentResponseData,
      isError: true,
      errorMessage: `Error: ${(error as Error).message || String(error)}`,
    };
  }
};

// Define the resource object
const linearAttachmentResource = {
  uri: 'linear-attachment',
  name: 'Linear Attachment',
  description: 'View details for a Linear attachment',
};

// Register the resource handler
registerResource(linearAttachmentResource, linearAttachmentResourceHandler);
