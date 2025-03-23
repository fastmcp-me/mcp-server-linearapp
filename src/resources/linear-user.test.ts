import { linearClient } from '../linear.js';
import { linearUserIssuesResourceHandler, LinearUserResponse } from './linear-user.js';

// Mock the Linear client
jest.mock('../linear.js', () => ({
  linearClient: {
    user: jest.fn(),
  },
}));

describe('User Resources', () => {
  // Clear all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('linearUserIssuesResourceHandler', () => {
    const mockUser = {
      id: 'user123',
      name: 'John Doe',
      displayName: 'Johnny',
      assignedIssues: jest.fn(),
    };

    const mockIssue1 = {
      id: 'issue1',
      title: 'Fix bug',
      identifier: 'ENG-1',
      description: 'Need to fix a bug',
      state: Promise.resolve({ name: 'Todo' }),
      priority: 1,
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

    it('should return user assigned issues when given a valid user ID', async () => {
      // Setup mocks
      (linearClient.user as jest.Mock).mockResolvedValue(mockUser);
      mockUser.assignedIssues.mockResolvedValue({
        nodes: [mockIssue1, mockIssue2],
      });

      // Call the handler
      const result = await linearUserIssuesResourceHandler({ userId: 'user123' });

      // Verify the result
      expect(result.isError).toBe(false);
      expect(linearClient.user).toHaveBeenCalledWith('user123');
      expect(mockUser.assignedIssues).toHaveBeenCalledWith({ first: 50 });

      // Parse response
      const responseData = JSON.parse((result.data as any).text) as LinearUserResponse;

      // Check user data
      expect(responseData.user).toMatchObject({
        id: 'user123',
        name: 'John Doe',
        displayName: 'Johnny',
      });

      // Check issues
      expect(responseData.assignedIssues).toHaveLength(2);
      expect(responseData.assignedIssues[0]).toMatchObject({
        id: 'issue1',
        title: 'Fix bug',
        identifier: 'ENG-1',
        description: 'Need to fix a bug',
        status: 'Todo',
        priority: 1,
      });

      // Check null description handling
      expect(responseData.assignedIssues[1].description).toBeNull();
    });

    it('should return an error when user ID is missing', async () => {
      // Call the handler with no userId
      const result = await linearUserIssuesResourceHandler({});

      // Verify the result
      expect(result.isError).toBe(true);
      expect(result.errorMessage).toBe('Invalid user ID');
      expect(result.data).toBeNull();
      expect(linearClient.user).not.toHaveBeenCalled();
    });

    it('should return an error when user is not found', async () => {
      // Setup mocks
      (linearClient.user as jest.Mock).mockResolvedValue(null);

      // Call the handler
      const result = await linearUserIssuesResourceHandler({ userId: 'nonexistent' });

      // Verify the result
      expect(result.isError).toBe(true);
      expect(result.errorMessage).toBe('User with ID nonexistent not found');
      expect(result.data).toBeNull();
    });

    it('should handle API errors gracefully', async () => {
      // Setup mocks
      (linearClient.user as jest.Mock).mockRejectedValue(new Error('API error'));

      // Call the handler
      const result = await linearUserIssuesResourceHandler({ userId: 'user123' });

      // Verify the result
      expect(result.isError).toBe(true);
      expect(result.errorMessage).toBe('Error: API error');
      expect(result.data).toBeNull();
    });
  });
});
