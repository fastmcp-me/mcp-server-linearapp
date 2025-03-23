import { linearSearchIssuesHandler } from './linear_search_issues.js';
import { linearClient } from '../linear.js';

// Mock the Linear client
jest.mock('../linear', () => ({
  linearClient: {
    issueSearch: jest.fn(),
  },
}));

const mockIssueSearch = linearClient.issueSearch as jest.Mock;

describe('Linear Search Issues Tool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return an error when query is missing', async () => {
    const result = await linearSearchIssuesHandler({});

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Error: Search query is required');
    expect(mockIssueSearch).not.toHaveBeenCalled();
  });

  it('should search issues with default parameters when only query is provided', async () => {
    const mockIssue = createMockIssue({
      id: 'issue1',
      identifier: 'TEAM-123',
      title: 'Test Issue',
    });

    mockIssueSearch.mockResolvedValueOnce({
      nodes: [mockIssue],
      pageInfo: {
        hasNextPage: false,
        endCursor: 'cursor123',
      },
    });

    const result = await linearSearchIssuesHandler({
      query: 'test query',
    });

    expect(mockIssueSearch).toHaveBeenCalledWith({
      first: 10,
      includeArchived: false,
      query: 'test query',
    });

    expect(result.isError).toBeUndefined();

    const parsedContent = JSON.parse(result.content[0].text);
    expect(parsedContent.issues).toHaveLength(1);
    expect(parsedContent.issues[0].id).toBe('issue1');
    expect(parsedContent.issues[0].identifier).toBe('TEAM-123');
    expect(parsedContent.issues[0].title).toBe('Test Issue');
    expect(parsedContent.pageInfo.hasNextPage).toBe(false);
    expect(parsedContent.pageInfo.endCursor).toBe('cursor123');
  });

  it('should search issues with custom parameters', async () => {
    const mockIssue = createMockIssue({
      id: 'issue2',
      identifier: 'TEAM-456',
      title: 'Custom Issue',
    });

    mockIssueSearch.mockResolvedValueOnce({
      nodes: [mockIssue],
      pageInfo: {
        hasNextPage: true,
        endCursor: 'cursor456',
      },
    });

    const result = await linearSearchIssuesHandler({
      query: 'custom query',
      includeArchived: true,
      limit: 5,
    });

    expect(mockIssueSearch).toHaveBeenCalledWith({
      first: 5,
      includeArchived: true,
      query: 'custom query',
    });

    expect(result.isError).toBeUndefined();

    const parsedContent = JSON.parse(result.content[0].text);
    expect(parsedContent.issues).toHaveLength(1);
    expect(parsedContent.issues[0].id).toBe('issue2');
    expect(parsedContent.issues[0].identifier).toBe('TEAM-456');
    expect(parsedContent.pageInfo.hasNextPage).toBe(true);
  });

  it('should handle empty search results', async () => {
    mockIssueSearch.mockResolvedValueOnce({
      nodes: [],
      pageInfo: {
        hasNextPage: false,
        endCursor: null,
      },
    });

    const result = await linearSearchIssuesHandler({
      query: 'no results query',
    });

    expect(result.isError).toBeUndefined();

    const parsedContent = JSON.parse(result.content[0].text);
    expect(parsedContent.issues).toHaveLength(0);
  });

  it('should handle when search result is not available', async () => {
    mockIssueSearch.mockResolvedValueOnce(null);

    const result = await linearSearchIssuesHandler({
      query: 'invalid query',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Error: Failed to search issues');
  });

  it('should handle API errors gracefully', async () => {
    mockIssueSearch.mockRejectedValueOnce(new Error('API error'));

    const result = await linearSearchIssuesHandler({
      query: 'error query',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Error: API error');
  });
});

// Helper to create mock issues with nested objects
function createMockIssue(data: any) {
  const issue: Record<string, any> = {
    id: data.id || 'mock-id',
    identifier: data.identifier || 'MOCK-123',
    title: data.title || 'Mock Issue',
    description: data.description || 'Mock description',
    url: data.url || 'https://linear.app/mock/issue/MOCK-123',
    createdAt: data.createdAt || '2023-01-01T00:00:00.000Z',
    updatedAt: data.updatedAt || '2023-01-02T00:00:00.000Z',
    state: Promise.resolve(data.state || { name: 'To Do' }),
    team: Promise.resolve(data.team || { name: 'Mock Team' }),
    assignee: Promise.resolve(data.assignee || { name: 'Mock User' }),
  };

  // Make all properties accessible as promises
  Object.keys(issue).forEach(key => {
    if (key !== 'state' && key !== 'team' && key !== 'assignee') {
      issue[key] = Promise.resolve(issue[key]);
    }
  });

  return issue;
}
