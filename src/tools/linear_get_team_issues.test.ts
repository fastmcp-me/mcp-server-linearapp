import { linearGetTeamIssuesHandler } from './linear_get_team_issues.js';
import { linearClient } from '../linear.js';

// Mock the Linear client
jest.mock('../linear.js', () => ({
  linearClient: {
    team: jest.fn(),
  },
}));

describe('Linear Get Team Issues Tool', () => {
  // Mock team object
  const mockTeam = {
    id: 'team123',
    name: Promise.resolve('Engineering'),
    key: Promise.resolve('ENG'),
    issues: jest.fn(),
    states: jest.fn(),
  };

  // Mock issue state
  const mockStates = {
    nodes: [
      { id: 'state1', name: 'Todo' },
      { id: 'state2', name: 'In Progress' },
      { id: 'state3', name: 'Done' },
    ],
  };

  // Mock issue objects
  const mockIssue1 = {
    id: Promise.resolve('issue1'),
    identifier: Promise.resolve('ENG-1'),
    title: Promise.resolve('Fix bug'),
    description: Promise.resolve('This is a bug description'),
    state: Promise.resolve({ name: 'Todo' }),
    assignee: Promise.resolve({ name: 'John Doe' }),
    priority: Promise.resolve(1),
    url: Promise.resolve('https://linear.app/team/issue/ENG-1'),
    createdAt: Promise.resolve('2023-01-01T00:00:00.000Z'),
    updatedAt: Promise.resolve('2023-01-02T00:00:00.000Z'),
  };

  const mockIssue2 = {
    id: Promise.resolve('issue2'),
    identifier: Promise.resolve('ENG-2'),
    title: Promise.resolve('Implement feature'),
    description: Promise.resolve('Feature description'),
    state: Promise.resolve({ name: 'In Progress' }),
    assignee: Promise.resolve(null),
    priority: Promise.resolve(2),
    url: Promise.resolve('https://linear.app/team/issue/ENG-2'),
    createdAt: Promise.resolve('2023-01-03T00:00:00.000Z'),
    updatedAt: Promise.resolve('2023-01-04T00:00:00.000Z'),
  };

  // Mock issues response
  const mockIssuesResponse = {
    nodes: [mockIssue1, mockIssue2],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    (linearClient.team as jest.Mock).mockResolvedValue(mockTeam);
    mockTeam.states.mockResolvedValue(mockStates);
    mockTeam.issues.mockResolvedValue(mockIssuesResponse);
  });

  it('should return an error when teamId is missing', async () => {
    const result = await linearGetTeamIssuesHandler({});

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Error: Team ID is required');
    expect(linearClient.team).not.toHaveBeenCalled();
  });

  it('should return an error when team is not found', async () => {
    (linearClient.team as jest.Mock).mockResolvedValue(null);

    const result = await linearGetTeamIssuesHandler({
      teamId: 'nonexistent',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Error: Team with ID nonexistent not found');
    expect(linearClient.team).toHaveBeenCalledWith('nonexistent');
  });

  it('should fetch issues with default parameters', async () => {
    const result = await linearGetTeamIssuesHandler({
      teamId: 'team123',
    });

    expect(result.isError).toBeUndefined();
    expect(mockTeam.issues).toHaveBeenCalledWith({
      first: 50,
      includeArchived: false,
    });

    const parsedResult = JSON.parse(result.content[0].text);
    expect(parsedResult.id).toBe('team123');
    expect(parsedResult.name).toBe('Engineering');
    expect(parsedResult.key).toBe('ENG');
    expect(parsedResult.issues).toHaveLength(2);
    expect(parsedResult.issues[0].identifier).toBe('ENG-1');
    expect(parsedResult.issues[1].identifier).toBe('ENG-2');
  });

  it('should apply status filter correctly', async () => {
    const result = await linearGetTeamIssuesHandler({
      teamId: 'team123',
      status: 'In Progress',
    });

    expect(result.isError).toBeUndefined();
    expect(mockTeam.issues).toHaveBeenCalledWith({
      first: 50,
      includeArchived: false,
      filter: {
        stateId: { eq: 'state2' },
      },
    });
  });

  it('should return an error when status is not found', async () => {
    const result = await linearGetTeamIssuesHandler({
      teamId: 'team123',
      status: 'Invalid Status',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe(
      'Error: Status "Invalid Status" not found for team Engineering'
    );
  });

  it('should apply priority filter correctly', async () => {
    const result = await linearGetTeamIssuesHandler({
      teamId: 'team123',
      priority: 1,
    });

    expect(result.isError).toBeUndefined();
    expect(mockTeam.issues).toHaveBeenCalledWith({
      first: 50,
      includeArchived: false,
      filter: {
        priority: { eq: 1 },
      },
    });
  });

  it('should apply assignee filter correctly', async () => {
    const result = await linearGetTeamIssuesHandler({
      teamId: 'team123',
      assigneeId: 'user123',
    });

    expect(result.isError).toBeUndefined();
    expect(mockTeam.issues).toHaveBeenCalledWith({
      first: 50,
      includeArchived: false,
      filter: {
        assigneeId: { eq: 'user123' },
      },
    });
  });

  it('should apply multiple filters correctly', async () => {
    const result = await linearGetTeamIssuesHandler({
      teamId: 'team123',
      status: 'Todo',
      priority: 1,
      assigneeId: 'user123',
    });

    expect(result.isError).toBeUndefined();
    expect(mockTeam.issues).toHaveBeenCalledWith({
      first: 50,
      includeArchived: false,
      filter: {
        stateId: { eq: 'state1' },
        priority: { eq: 1 },
        assigneeId: { eq: 'user123' },
      },
    });
  });

  it('should handle custom limit and includeArchived parameters', async () => {
    const result = await linearGetTeamIssuesHandler({
      teamId: 'team123',
      limit: 10,
      includeArchived: true,
    });

    expect(result.isError).toBeUndefined();
    expect(mockTeam.issues).toHaveBeenCalledWith({
      first: 10,
      includeArchived: true,
    });
  });

  it('should handle when issues response is null', async () => {
    mockTeam.issues.mockResolvedValue(null);

    const result = await linearGetTeamIssuesHandler({
      teamId: 'team123',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Error: Failed to fetch team issues');
  });

  it('should handle API errors gracefully', async () => {
    mockTeam.issues.mockRejectedValue(new Error('API error'));

    const result = await linearGetTeamIssuesHandler({
      teamId: 'team123',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Error: API error');
  });
});
