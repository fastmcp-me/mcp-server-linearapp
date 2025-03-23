import { linearGetAttachmentsHandler, linearGetAttachmentsTool } from './linear_get_attachments.js';

// Mock console.error to prevent noise in test output
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('linear_get_attachments tool', () => {
  it('should return attachments for an issue with multiple attachments', async () => {
    const result = await linearGetAttachmentsHandler({
      issueId: 'issue1',
    });

    expect(result.isError).toBeUndefined();
    expect(result.content).toHaveLength(1);

    const parsedResponse = JSON.parse(result.content[0].text);
    expect(parsedResponse.success).toBe(true);
    expect(parsedResponse.issueId).toBe('issue1');
    expect(parsedResponse.issueTitle).toBe('Test Issue 1');
    expect(parsedResponse.totalCount).toBe(2);

    // Check attachments array
    expect(parsedResponse.attachments).toHaveLength(2);

    // Check first attachment
    expect(parsedResponse.attachments[0].id).toBe('attachment1');
    expect(parsedResponse.attachments[0].url).toBe('https://example.com/doc1.pdf');
    expect(parsedResponse.attachments[0].title).toBe('Requirements Document');
    expect(parsedResponse.attachments[0].subtitle).toBe('Project requirements');

    // Check second attachment
    expect(parsedResponse.attachments[1].id).toBe('attachment2');
    expect(parsedResponse.attachments[1].title).toBe('Design Mockup');
  });

  it('should return attachments for an issue with a single attachment', async () => {
    const result = await linearGetAttachmentsHandler({
      issueId: 'issue2',
    });

    expect(result.isError).toBeUndefined();
    expect(result.content).toHaveLength(1);

    const parsedResponse = JSON.parse(result.content[0].text);
    expect(parsedResponse.success).toBe(true);
    expect(parsedResponse.issueId).toBe('issue2');
    expect(parsedResponse.totalCount).toBe(1);

    // Check attachment
    expect(parsedResponse.attachments).toHaveLength(1);
    expect(parsedResponse.attachments[0].id).toBe('attachment3');
    expect(parsedResponse.attachments[0].title).toBe('Technical Specification');
    expect(parsedResponse.attachments[0].subtitle).toBeUndefined();
  });

  it('should return empty attachments array for an issue with no attachments', async () => {
    const result = await linearGetAttachmentsHandler({
      issueId: 'issue3',
    });

    expect(result.isError).toBeUndefined();
    expect(result.content).toHaveLength(1);

    const parsedResponse = JSON.parse(result.content[0].text);
    expect(parsedResponse.success).toBe(true);
    expect(parsedResponse.issueId).toBe('issue3');
    expect(parsedResponse.totalCount).toBe(0);
    expect(parsedResponse.attachments).toHaveLength(0);
  });

  it('should fail when issueId is missing', async () => {
    const result = await linearGetAttachmentsHandler({});

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Issue ID is required');
  });

  it('should fail when issue does not exist', async () => {
    const result = await linearGetAttachmentsHandler({
      issueId: 'nonexistent',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Issue with ID nonexistent not found');
  });

  it('should export the correct tool definition', () => {
    expect(linearGetAttachmentsTool).toEqual({
      name: 'linear_get_attachments',
      description: 'Get attachments for an issue in Linear',
      inputSchema: {
        type: 'object',
        properties: {
          issueId: {
            type: 'string',
            description: 'Issue ID to get attachments for',
          },
        },
        required: ['issueId'],
      },
    });
  });
});
