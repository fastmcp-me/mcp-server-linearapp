import { linearAddAttachmentHandler, linearAddAttachmentTool } from './linear_add_attachment.js';

// Mock console.error to prevent noise in test output
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('linear_add_attachment tool', () => {
  it('should successfully add an attachment with required parameters', async () => {
    const result = await linearAddAttachmentHandler({
      issueId: 'issue1',
      url: 'https://example.com/attachment.pdf',
      title: 'Test Attachment',
    });

    expect(result.isError).toBeUndefined();
    expect(result.content).toHaveLength(1);

    const parsedResponse = JSON.parse(result.content[0].text);
    expect(parsedResponse.success).toBe(true);
    expect(parsedResponse.attachment).toBeDefined();
    expect(parsedResponse.attachment.id).toBeDefined();
    expect(parsedResponse.attachment.url).toBe('https://example.com/attachment.pdf');
    expect(parsedResponse.attachment.title).toBe('Test Attachment');
    expect(parsedResponse.attachment.createdAt).toBeDefined();
  });

  it('should successfully add an attachment with all parameters', async () => {
    const result = await linearAddAttachmentHandler({
      issueId: 'issue1',
      url: 'https://example.com/attachment.pdf',
      title: 'Test Attachment',
      subtitle: 'Test Subtitle',
      icon: 'https://example.com/icon.png',
    });

    expect(result.isError).toBeUndefined();
    expect(result.content).toHaveLength(1);

    const parsedResponse = JSON.parse(result.content[0].text);
    expect(parsedResponse.success).toBe(true);
    expect(parsedResponse.attachment).toBeDefined();
    expect(parsedResponse.attachment.url).toBe('https://example.com/attachment.pdf');
    expect(parsedResponse.attachment.title).toBe('Test Attachment');
    expect(parsedResponse.attachment.subtitle).toBe('Test Subtitle');
    expect(parsedResponse.attachment.icon).toBe('https://example.com/icon.png');
  });

  it('should fail when issueId is missing', async () => {
    const result = await linearAddAttachmentHandler({
      url: 'https://example.com/attachment.pdf',
      title: 'Test Attachment',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Issue ID is required');
  });

  it('should fail when url is missing', async () => {
    const result = await linearAddAttachmentHandler({
      issueId: 'issue1',
      title: 'Test Attachment',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('URL is required');
  });

  it('should fail when title is missing', async () => {
    const result = await linearAddAttachmentHandler({
      issueId: 'issue1',
      url: 'https://example.com/attachment.pdf',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Title is required');
  });

  it('should fail with invalid URL format', async () => {
    const result = await linearAddAttachmentHandler({
      issueId: 'issue1',
      url: 'invalid-url',
      title: 'Test Attachment',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Invalid URL format');
  });

  it('should fail when issue does not exist', async () => {
    const result = await linearAddAttachmentHandler({
      issueId: 'nonexistent',
      url: 'https://example.com/attachment.pdf',
      title: 'Test Attachment',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Issue with ID nonexistent not found');
  });

  it('should export the correct tool definition', () => {
    expect(linearAddAttachmentTool).toEqual({
      name: 'linear_add_attachment',
      description: 'Add an attachment to an issue in Linear',
      inputSchema: {
        type: 'object',
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
    });
  });
});
