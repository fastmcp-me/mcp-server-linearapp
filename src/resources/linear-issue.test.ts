import { linearClient } from '../linear.js';
import { linearIssueResourceHandler, LinearIssueResponse } from './linear-issue.js';

// Mock the Linear client
jest.mock('../linear.js', () => ({
  linearClient: {
    issue: jest.fn(),
  },
}));

describe('Issue Resources', () => {
  // Clear all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('linearIssueResourceHandler', () => {
    const mockIssue = {
      id: 'issue123',
      title: 'Fix critical bug',
      description: 'This is a critical bug that needs fixing',
      identifier: 'ENG-123',
      priority: 1,
      url: 'https://linear.app/company/issue/ENG-123',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-02'),
      comments: jest.fn(),
    };

    const mockComment1 = {
      id: 'comment1',
      body: 'This is a comment',
      createdAt: new Date('2023-01-01T10:00:00Z'),
      user: Promise.resolve({
        id: 'user1',
        name: 'John Doe',
        displayName: 'Johnny',
      }),
    };

    const mockComment2 = {
      id: 'comment2',
      body: 'This is another comment',
      createdAt: new Date('2023-01-01T11:00:00Z'),
      user: Promise.resolve(null),
    };

    it('should return issue data with comments when given a valid issue ID', async () => {
      // Setup mocks
      (linearClient.issue as jest.Mock).mockResolvedValue(mockIssue);
      mockIssue.comments.mockResolvedValue({
        nodes: [mockComment1, mockComment2],
      });

      // Call the handler
      const result = await linearIssueResourceHandler({ issueId: 'issue123' });

      // Verify the result
      expect(result.isError).toBe(false);
      expect(linearClient.issue).toHaveBeenCalledWith('issue123');
      expect(mockIssue.comments).toHaveBeenCalled();

      // Parse response
      const responseData = JSON.parse((result.data as any).text) as LinearIssueResponse;

      // Check issue data
      expect(responseData).toMatchObject({
        id: 'issue123',
        title: 'Fix critical bug',
        description: 'This is a critical bug that needs fixing',
        identifier: 'ENG-123',
        priority: 1,
      });

      // Check comments
      expect(responseData.comments).toHaveLength(2);
      expect(responseData.comments[0]).toMatchObject({
        id: 'comment1',
        body: 'This is a comment',
      });
      expect(responseData.comments[0].user).toMatchObject({
        id: 'user1',
        name: 'John Doe',
        displayName: 'Johnny',
      });

      // Check comment with null user
      expect(responseData.comments[1].user).toBeNull();
    });

    it('should return an error when issue ID is missing', async () => {
      // Call the handler with no issueId
      const result = await linearIssueResourceHandler({});

      // Verify the result
      expect(result.isError).toBe(true);
      expect(result.errorMessage).toBe('Invalid issue ID');
      expect(result.data).toBeNull();
      expect(linearClient.issue).not.toHaveBeenCalled();
    });

    it('should return an error when issue is not found', async () => {
      // Setup mocks
      (linearClient.issue as jest.Mock).mockResolvedValue(null);

      // Call the handler
      const result = await linearIssueResourceHandler({ issueId: 'nonexistent' });

      // Verify the result
      expect(result.isError).toBe(true);
      expect(result.errorMessage).toBe('Issue with ID nonexistent not found');
      expect(result.data).toBeNull();
      expect(linearClient.issue).toHaveBeenCalledWith('nonexistent');
    });

    it('should handle API errors gracefully', async () => {
      // Setup mocks
      (linearClient.issue as jest.Mock).mockRejectedValue(new Error('API error'));

      // Call the handler
      const result = await linearIssueResourceHandler({ issueId: 'issue123' });

      // Verify the result
      expect(result.isError).toBe(true);
      expect(result.errorMessage).toBe('Error: API error');
      expect(result.data).toBeNull();
    });
  });
});
