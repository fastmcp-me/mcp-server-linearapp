import { linearGetUserIssuesHandler } from './linear_get_user_issues.js';
import { linearClient } from '../linear.js';

// Mock the Linear client
jest.mock('../linear.js', () => ({
  linearClient: {
    user: jest.fn(),
    viewer: {},
  },
}));

describe('Linear Get User Issues Tool', () => {
  // Mock user data
  const mockUser = {
    id: Promise.resolve('user123'),
    name: Promise.resolve('John Doe'),
    displayName: Promise.resolve('John'),
    assignedIssues: jest.fn(),
  };

  // Mock issue data
  const mockIssue1 = {
    id: Promise.resolve('issue1'),
    number: Promise.resolve(101),
    title: Promise.resolve('Bug fix needed'),
    url: Promise.resolve('https://linear.app/team/issue/TEAM-101'),
    priority: Promise.resolve(1),
    state: Promise.resolve({ name: 'Todo' }),
    team: Promise.resolve({ name: 'Engineering' }),
    createdAt: Promise.resolve('2023-01-01T00:00:00.000Z'),
  };

  const mockIssue2 = {
    id: Promise.resolve('issue2'),
    number: Promise.resolve(102),
    title: Promise.resolve('Implement feature'),
    url: Promise.resolve('https://linear.app/team/issue/TEAM-102'),
    priority: Promise.resolve(2),
    state: Promise.resolve({ name: 'In Progress' }),
    team: Promise.resolve({ name: 'Engineering' }),
    createdAt: Promise.resolve('2023-01-03T00:00:00.000Z'),
  };

  // Mock assigned issues response
  const mockAssignedIssuesResponse = {
    nodes: [mockIssue1, mockIssue2],
    pageInfo: {
      hasNextPage: false,
      endCursor: 'cursor123',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    (linearClient.user as jest.Mock).mockResolvedValue(mockUser);
    Object.defineProperty(linearClient, 'viewer', {
      get: jest.fn().mockResolvedValue(mockUser),
    });
    mockUser.assignedIssues.mockResolvedValue(mockAssignedIssuesResponse);
  });

  it('should fetch current user issues when userId is not provided', async () => {
    const result = await linearGetUserIssuesHandler({});

    expect(result.isError).toBeUndefined();
    expect(linearClient.user).not.toHaveBeenCalled();
    expect(mockUser.assignedIssues).toHaveBeenCalledWith({
      first: 50,
      includeArchived: false,
    });

    const parsedContent = JSON.parse(result.content[0].text);
    expect(parsedContent.user.id).toBe('user123');
    expect(parsedContent.user.name).toBe('John Doe');
    expect(parsedContent.issues).toHaveLength(2);
    expect(parsedContent.issues[0].id).toBe('issue1');
    expect(parsedContent.issues[1].id).toBe('issue2');
    expect(parsedContent.pageInfo.hasNextPage).toBe(false);
    expect(parsedContent.pageInfo.endCursor).toBe('cursor123');
  });

  it('should fetch specific user issues when userId is provided', async () => {
    const result = await linearGetUserIssuesHandler({
      userId: 'user123',
    });

    expect(result.isError).toBeUndefined();
    expect(linearClient.user).toHaveBeenCalledWith('user123');
    expect(mockUser.assignedIssues).toHaveBeenCalledWith({
      first: 50,
      includeArchived: false,
    });

    const parsedContent = JSON.parse(result.content[0].text);
    expect(parsedContent.user.id).toBe('user123');
    expect(parsedContent.issues).toHaveLength(2);
  });

  it('should return an error when user is not found', async () => {
    (linearClient.user as jest.Mock).mockResolvedValue(null);

    const result = await linearGetUserIssuesHandler({
      userId: 'nonexistent',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Error: User with ID nonexistent not found');
    expect(linearClient.user).toHaveBeenCalledWith('nonexistent');
  });

  it('should respect custom limit and includeArchived parameters', async () => {
    const result = await linearGetUserIssuesHandler({
      userId: 'user123',
      limit: 10,
      includeArchived: true,
    });

    expect(result.isError).toBeUndefined();
    expect(mockUser.assignedIssues).toHaveBeenCalledWith({
      first: 10,
      includeArchived: true,
    });
  });

  it('should handle empty issues list', async () => {
    mockUser.assignedIssues.mockResolvedValueOnce({
      nodes: [],
      pageInfo: {
        hasNextPage: false,
        endCursor: null,
      },
    });

    const result = await linearGetUserIssuesHandler({
      userId: 'user123',
    });

    expect(result.isError).toBeUndefined();

    const parsedContent = JSON.parse(result.content[0].text);
    expect(parsedContent.issues).toHaveLength(0);
  });

  it('should handle when assigned issues response is null', async () => {
    mockUser.assignedIssues.mockResolvedValueOnce(null);

    const result = await linearGetUserIssuesHandler({
      userId: 'user123',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("Error: Failed to fetch user's issues");
  });

  it('should handle API errors gracefully', async () => {
    mockUser.assignedIssues.mockRejectedValueOnce(new Error('API error'));

    const result = await linearGetUserIssuesHandler({
      userId: 'user123',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Error: API error');
  });
});
