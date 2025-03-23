import { linearClient } from '../linear.js';
import {
  linearTeamResourceHandler,
  linearTeamIssuesResourceHandler,
  LinearTeamDetailResponse,
  LinearTeamIssuesResponse,
} from './linear-team.js';

// Mock the Linear client
jest.mock('../linear.js', () => ({
  linearClient: {
    team: jest.fn(),
  },
}));

describe('Team Resources', () => {
  // Clear all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('linearTeamIssuesResourceHandler', () => {
    // Mock team and issues for the tests
    const mockTeam = {
      id: 'team123',
      name: 'Engineering',
      key: 'ENG',
      issues: jest.fn(),
    };

    const mockIssue1 = {
      id: 'issue1',
      title: 'Fix bug',
      identifier: 'ENG-1',
      description: 'Need to fix a bug',
      state: Promise.resolve({ name: 'Todo' }),
      priority: 1,
      assignee: Promise.resolve({
        id: 'user1',
        name: 'John Doe',
        displayName: 'Johnny',
      }),
      url: 'https://linear.app/company/issue/ENG-1',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-02'),
    };

    const mockIssue2 = {
      id: 'issue2',
      title: 'Implement feature',
      identifier: 'ENG-2',
      description: null,
      state: Promise.resolve({ name: 'In Progress' }),
      priority: 2,
      url: 'https://linear.app/company/issue/ENG-2',
      createdAt: new Date('2023-01-03'),
      updatedAt: new Date('2023-01-04'),
    };

    it('should return team issues when given a valid team ID', async () => {
      // Setup mocks
      (linearClient.team as jest.Mock).mockResolvedValue(mockTeam);
      mockTeam.issues.mockResolvedValue({
        nodes: [mockIssue1, mockIssue2],
      });

      // Call the handler
      const result = await linearTeamIssuesResourceHandler({ teamId: 'team123' });

      // Verify the result
      expect(result.isError).toBe(false);
      expect(linearClient.team).toHaveBeenCalledWith('team123');
      expect(mockTeam.issues).toHaveBeenCalledWith({ first: 50 });

      // Get data from the result and check it's properly formatted
      expect(result.data).not.toBeNull();

      // Type assertion to tell TypeScript this is the expected resource type
      const responseData = result.data as unknown as LinearTeamIssuesResponse;

      // Check team data
      expect(responseData.team).toMatchObject({
        id: 'team123',
        name: 'Engineering',
        key: 'ENG',
      });

      // Check issues
      expect(responseData.issues).toHaveLength(2);
      expect(responseData.issues[0]).toMatchObject({
        id: 'issue1',
        title: 'Fix bug',
        identifier: 'ENG-1',
        description: 'Need to fix a bug',
        status: 'Todo',
        priority: 1,
      });

      // Check null description handling
      expect(responseData.issues[1].description).toBeNull();
    });

    it('should return an error when team ID is missing', async () => {
      // Call the handler with no teamId
      const result = await linearTeamIssuesResourceHandler({});

      // Verify the result
      expect(result.isError).toBe(true);
      expect(result.errorMessage).toBe('Invalid team ID');
      expect(result.data).toBeNull();
      expect(linearClient.team).not.toHaveBeenCalled();
    });

    it('should return an error when team is not found', async () => {
      // Setup mocks
      (linearClient.team as jest.Mock).mockResolvedValue(null);

      // Call the handler
      const result = await linearTeamIssuesResourceHandler({ teamId: 'nonexistent' });

      // Verify the result
      expect(result.isError).toBe(true);
      expect(result.errorMessage).toBe('Team with ID nonexistent not found');
      expect(result.data).toBeNull();
    });

    it('should handle API errors gracefully', async () => {
      // Setup mocks
      (linearClient.team as jest.Mock).mockRejectedValue(new Error('API error'));

      // Call the handler
      const result = await linearTeamIssuesResourceHandler({ teamId: 'team123' });

      // Verify the result
      expect(result.isError).toBe(true);
      expect(result.errorMessage).toBe('Error: API error');
      expect(result.data).toBeNull();
    });
  });
});

describe('linear-team resource', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock the team resource implementation
    (linearClient.team as jest.Mock).mockImplementation(teamId => {
      if (teamId === 'team1') {
        return Promise.resolve({
          id: 'team1',
          name: 'Frontend Team',
          key: 'FE',
          description: 'Frontend development team',
          color: '#0000FF',
          icon: 'https://example.com/icon.png',
          members: () =>
            Promise.resolve({
              nodes: [
                { id: 'user1', name: 'John Doe', displayName: 'Johnny', email: 'john@example.com' },
                { id: 'user2', name: 'Jane Smith', displayName: 'Jane', email: 'jane@example.com' },
              ],
            }),
          states: () =>
            Promise.resolve({
              nodes: [
                { id: 'state1', name: 'Todo', color: '#FF0000', type: 'unstarted' },
                { id: 'state2', name: 'In Progress', color: '#FFFF00', type: 'started' },
                { id: 'state3', name: 'Done', color: '#00FF00', type: 'completed' },
              ],
            }),
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-02'),
        });
      } else if (teamId === 'nonexistent') {
        return Promise.resolve(null);
      }
      return Promise.reject(new Error('API error'));
    });
  });

  it('should return team details for a valid team ID', async () => {
    const result = await linearTeamResourceHandler({ teamId: 'team1' });

    expect(result.isError).toBe(false);
    expect(result.data).toBeDefined();

    const data = result.data as LinearTeamDetailResponse;
    expect(data.id).toBe('team1');
    expect(data.name).toBe('Frontend Team');
    expect(data.key).toBe('FE');
    expect(data.description).toBe('Frontend development team');
    expect(data.color).toBe('#0000FF');
    expect(data.icon).toBe('https://example.com/icon.png');

    expect(data.members).toHaveLength(2);
    expect(data.members[0].name).toBe('John Doe');
    expect(data.members[1].name).toBe('Jane Smith');

    expect(data.states).toHaveLength(3);
    expect(data.states[0].name).toBe('Todo');
    expect(data.states[1].name).toBe('In Progress');
    expect(data.states[2].name).toBe('Done');
  });

  it('should handle invalid team ID', async () => {
    const result = await linearTeamResourceHandler({ teamId: '' });

    expect(result.isError).toBe(true);
    expect(result.errorMessage).toBe('Invalid team ID');
    expect(result.data).toBeNull();
  });

  it('should handle non-existent team ID', async () => {
    const result = await linearTeamResourceHandler({ teamId: 'nonexistent' });

    expect(result.isError).toBe(true);
    expect(result.errorMessage).toBe('Team with ID nonexistent not found');
    expect(result.data).toBeNull();
  });
});
