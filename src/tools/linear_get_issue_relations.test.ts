import {
  linearGetIssueRelationsHandler,
  linearGetIssueRelationsTool,
} from './linear_get_issue_relations.js';

// Mock console.error to prevent noise in test output
jest.spyOn(console, 'error').mockImplementation(() => {});

// Define an interface for relation objects in the response
interface RelationResponse {
  id: string;
  type: string;
  direction: string;
  createdAt: string;
  relatedIssue: {
    id: string;
    title: string;
    identifier: string;
  };
}

describe('linear_get_issue_relations tool', () => {
  it('should return all relationships for an issue', async () => {
    const result = await linearGetIssueRelationsHandler({
      issueId: 'issue1',
    });

    expect(result.isError).toBeUndefined();
    expect(result.content).toHaveLength(1);

    const parsedResponse = JSON.parse(result.content[0].text);
    expect(parsedResponse.success).toBe(true);
    expect(parsedResponse.issueId).toBe('issue1');
    expect(parsedResponse.issueTitle).toBe('Test Issue 1');
    expect(parsedResponse.issueIdentifier).toBe('ABC-123');

    // Check relations array
    expect(parsedResponse.relations).toHaveLength(3); // Two outgoing, one incoming
    expect(parsedResponse.totalCount).toBe(3);

    // Verify both outgoing and incoming relations are included
    const outgoingRelations = parsedResponse.relations.filter(
      (r: RelationResponse) => r.direction === 'outgoing'
    );
    const incomingRelations = parsedResponse.relations.filter(
      (r: RelationResponse) => r.direction === 'incoming'
    );

    expect(outgoingRelations.length).toBe(2);
    expect(incomingRelations.length).toBe(1);

    // Check specific relation details
    const blocksRelation = parsedResponse.relations.find(
      (r: RelationResponse) => r.type === 'blocks'
    );
    expect(blocksRelation).toBeDefined();
    expect(blocksRelation.relatedIssue.id).toBe('issue2');
    expect(blocksRelation.direction).toBe('outgoing');

    const relatedRelation = parsedResponse.relations.find(
      (r: RelationResponse) => r.type === 'related'
    );
    expect(relatedRelation).toBeDefined();
    expect(relatedRelation.relatedIssue.id).toBe('issue3');
    expect(relatedRelation.direction).toBe('outgoing');

    const blockedByRelation = parsedResponse.relations.find(
      (r: RelationResponse) => r.type === 'blocked_by'
    );
    expect(blockedByRelation).toBeDefined();
    expect(blockedByRelation.relatedIssue.id).toBe('issue2');
    expect(blockedByRelation.direction).toBe('incoming');
  });

  it('should filter relationships by type', async () => {
    const result = await linearGetIssueRelationsHandler({
      issueId: 'issue1',
      type: 'blocks',
    });

    expect(result.isError).toBeUndefined();

    const parsedResponse = JSON.parse(result.content[0].text);

    // Only relationships with type 'blocks' should be included
    expect(parsedResponse.relations.length).toBe(1);
    expect(parsedResponse.relations[0].type).toBe('blocks');
    expect(parsedResponse.relations[0].relatedIssue.id).toBe('issue2');
  });

  it('should handle case-insensitive relationship type filter', async () => {
    const result = await linearGetIssueRelationsHandler({
      issueId: 'issue1',
      type: 'BLOCKS',
    });

    expect(result.isError).toBeUndefined();

    const parsedResponse = JSON.parse(result.content[0].text);
    expect(parsedResponse.relations.length).toBe(1);
    expect(parsedResponse.relations[0].type).toBe('blocks');
  });

  it('should return empty relations array when issue has no relationships', async () => {
    // issue3 has no outgoing relations in our mock data that match the filter
    const result = await linearGetIssueRelationsHandler({
      issueId: 'issue3',
      type: 'blocks',
    });

    expect(result.isError).toBeUndefined();

    const parsedResponse = JSON.parse(result.content[0].text);
    expect(parsedResponse.relations).toHaveLength(0);
    expect(parsedResponse.totalCount).toBe(0);
  });

  it('should fail when issueId is missing', async () => {
    const result = await linearGetIssueRelationsHandler({});

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Issue ID is required');
  });

  it('should fail with invalid relationship type', async () => {
    const result = await linearGetIssueRelationsHandler({
      issueId: 'issue1',
      type: 'invalid_type',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Invalid relationship type');
  });

  it('should fail when issue does not exist', async () => {
    const result = await linearGetIssueRelationsHandler({
      issueId: 'nonexistent',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Issue with ID nonexistent not found');
  });

  it('should export the correct tool definition', () => {
    expect(linearGetIssueRelationsTool).toEqual({
      name: 'linear_get_issue_relations',
      description: 'Get relationships for an issue in Linear',
      inputSchema: {
        type: 'object',
        properties: {
          issueId: {
            type: 'string',
            description: 'Issue ID to get relationships for',
          },
          type: {
            type: 'string',
            description: 'Filter by relationship type',
          },
        },
        required: ['issueId'],
      },
    });
  });
});
