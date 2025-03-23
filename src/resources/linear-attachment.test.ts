import { linearAttachmentResourceHandler } from './linear-attachment.js';

interface AttachmentResponse {
  attachment: {
    id: string;
    url: string;
    title: string;
    subtitle?: string;
    source?: string;
    createdAt: string;
    updatedAt: string;
  };
  issue: {
    id: string;
    title: string;
    identifier: string;
  };
}

describe('linearAttachmentResourceHandler', () => {
  it('should return attachment details for a valid attachment ID', async () => {
    const result = await linearAttachmentResourceHandler({
      uri: 'linear-attachment:///attachment1',
    });

    expect(result.isError).toBeUndefined();
    const response = result.data as AttachmentResponse;

    // Check attachment properties
    expect(response.attachment.id).toBe('attachment1');
    expect(response.attachment.url).toBe('https://example.com/doc1.pdf');
    expect(response.attachment.title).toBe('Requirements Document');
    expect(response.attachment.subtitle).toBe('Project requirements');
    expect(response.attachment.source).toBe('Manual upload');
    expect(response.attachment.createdAt).toBe('2023-08-01T12:00:00Z');
    expect(response.attachment.updatedAt).toBe('2023-08-01T12:00:00Z');

    // Check issue properties
    expect(response.issue.id).toBe('issue1');
    expect(response.issue.title).toBe('Test Issue 1');
    expect(response.issue.identifier).toBe('PROJ-123');
  });

  it('should return different attachment details for another valid attachment ID', async () => {
    const result = await linearAttachmentResourceHandler({
      uri: 'linear-attachment:///attachment3',
    });

    expect(result.isError).toBeUndefined();
    const response = result.data as AttachmentResponse;

    // Check attachment properties
    expect(response.attachment.id).toBe('attachment3');
    expect(response.attachment.title).toBe('Technical Specification');
    expect(response.attachment.source).toBe('Google Drive');

    // Check issue properties
    expect(response.issue.id).toBe('issue2');
    expect(response.issue.title).toBe('Test Issue 2');
    expect(response.issue.identifier).toBe('PROJ-456');
  });

  it('should return error for invalid URI format', async () => {
    // Test with invalid URI format
    const result = await linearAttachmentResourceHandler({
      uri: 'linear-attachment://invalid',
    });

    expect(result.isError).toBe(true);
    expect(result.errorMessage).toContain('Invalid URI format');
  });

  it('should return error for non-existent attachment ID', async () => {
    // Test with non-existent attachment ID
    const result = await linearAttachmentResourceHandler({
      uri: 'linear-attachment:///nonexistent',
    });

    expect(result.isError).toBe(true);
    expect(result.errorMessage).toContain('Attachment with ID nonexistent not found');
  });

  it('should return error when URI is missing', async () => {
    const result = await linearAttachmentResourceHandler({});

    expect(result.isError).toBe(true);
    expect(result.errorMessage).toContain('URI is required');
  });
});
