import { linearLinkIssuesHandler, linearLinkIssuesTool } from './linear_link_issues.js';

// Mock console.error to prevent noise in test output
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('linear_link_issues tool', () => {
  it('should successfully create a relationship between issues with valid parameters', async () => {
    const result = await linearLinkIssuesHandler({
      issueId: 'issue1',
      relatedIssueId: 'issue2',
      type: 'blocks',
    });

    expect(result.isError).toBeUndefined();
    expect(result.content).toHaveLength(1);

    const parsedResponse = JSON.parse(result.content[0].text);
    expect(parsedResponse.success).toBe(true);
    expect(parsedResponse.relation).toBeDefined();
    expect(parsedResponse.relation.id).toBeDefined();
    expect(parsedResponse.relation.type).toBe('blocks');
    expect(parsedResponse.relation.sourceIssueId).toBe('issue1');
    expect(parsedResponse.relation.targetIssueId).toBe('issue2');
    expect(parsedResponse.relation.createdAt).toBeDefined();

    // Check source issue
    expect(parsedResponse.sourceIssue.id).toBe('issue1');
    expect(parsedResponse.sourceIssue.title).toBe('Test Issue 1');
    expect(parsedResponse.sourceIssue.identifier).toBe('ABC-123');

    // Check target issue
    expect(parsedResponse.targetIssue.id).toBe('issue2');
    expect(parsedResponse.targetIssue.title).toBe('Test Issue 2');
    expect(parsedResponse.targetIssue.identifier).toBe('ABC-124');
  });

  it('should successfully create a relationship with a different type', async () => {
    const result = await linearLinkIssuesHandler({
      issueId: 'issue2',
      relatedIssueId: 'issue3',
      type: 'related',
    });

    expect(result.isError).toBeUndefined();

    const parsedResponse = JSON.parse(result.content[0].text);
    expect(parsedResponse.relation.type).toBe('related');
    expect(parsedResponse.relation.sourceIssueId).toBe('issue2');
    expect(parsedResponse.relation.targetIssueId).toBe('issue3');
  });

  it('should handle uppercase relationship types', async () => {
    const result = await linearLinkIssuesHandler({
      issueId: 'issue1',
      relatedIssueId: 'issue3',
      type: 'DUPLICATE',
    });

    expect(result.isError).toBeUndefined();

    const parsedResponse = JSON.parse(result.content[0].text);
    expect(parsedResponse.relation.type).toBe('duplicate');
  });

  it('should fail when issueId is missing', async () => {
    const result = await linearLinkIssuesHandler({
      relatedIssueId: 'issue2',
      type: 'blocks',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Source issue ID is required');
  });

  it('should fail when relatedIssueId is missing', async () => {
    const result = await linearLinkIssuesHandler({
      issueId: 'issue1',
      type: 'blocks',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Target issue ID is required');
  });

  it('should fail when type is missing', async () => {
    const result = await linearLinkIssuesHandler({
      issueId: 'issue1',
      relatedIssueId: 'issue2',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Relationship type is required');
  });

  it('should fail with invalid relationship type', async () => {
    const result = await linearLinkIssuesHandler({
      issueId: 'issue1',
      relatedIssueId: 'issue2',
      type: 'invalid_type',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Invalid relationship type');
  });

  it('should fail when source issue does not exist', async () => {
    const result = await linearLinkIssuesHandler({
      issueId: 'nonexistent',
      relatedIssueId: 'issue2',
      type: 'blocks',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Source issue with ID nonexistent not found');
  });

  it('should fail when target issue does not exist', async () => {
    const result = await linearLinkIssuesHandler({
      issueId: 'issue1',
      relatedIssueId: 'nonexistent',
      type: 'blocks',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Target issue with ID nonexistent not found');
  });

  it('should fail when trying to relate an issue to itself', async () => {
    const result = await linearLinkIssuesHandler({
      issueId: 'issue1',
      relatedIssueId: 'issue1',
      type: 'blocks',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain(
      'Cannot create a relationship between an issue and itself'
    );
  });

  it('should export the correct tool definition', () => {
    expect(linearLinkIssuesTool).toEqual({
      name: 'linear_link_issues',
      description: 'Create a relationship between issues in Linear',
      inputSchema: {
        type: 'object',
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
    });
  });
});
