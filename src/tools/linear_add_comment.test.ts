/**
 * Unit tests for the Linear Add Comment tool
 *
 * These tests verify that the tool properly validates input parameters,
 * handles error cases, and successfully adds comments to issues when given valid inputs.
 */
import { linearAddCommentHandler } from './linear_add_comment.js';
import { linearClient } from '../linear.js';

// Mock the Linear client
jest.mock('../linear.js', () => ({
  linearClient: {
    issue: jest.fn(),
    createComment: jest.fn(),
  },
}));

describe('Linear Add Comment Tool', () => {
  // Reset mocks between tests
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return an error when issueId is missing', async () => {
    // Call the handler without an issueId
    const result = await linearAddCommentHandler({
      body: 'Test comment',
    });

    // Verify error response
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Error: Issue ID is required');

    // Ensure methods were not called
    expect(linearClient.issue).not.toHaveBeenCalled();
    expect(linearClient.createComment).not.toHaveBeenCalled();
  });

  it('should return an error when body is missing', async () => {
    // Call the handler without a body
    const result = await linearAddCommentHandler({
      issueId: 'issue123',
    });

    // Verify error response
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Error: Comment body is required');

    // Ensure methods were not called
    expect(linearClient.issue).not.toHaveBeenCalled();
    expect(linearClient.createComment).not.toHaveBeenCalled();
  });

  it('should return an error when issue is not found', async () => {
    // Mock issue not found
    (linearClient.issue as jest.Mock).mockResolvedValue(null);

    // Call the handler with an invalid issueId
    const result = await linearAddCommentHandler({
      issueId: 'nonexistent123',
      body: 'Test comment',
    });

    // Verify error response
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Error: Issue with ID nonexistent123 not found');

    // Ensure issue was checked but createComment was not called
    expect(linearClient.issue).toHaveBeenCalledWith('nonexistent123');
    expect(linearClient.createComment).not.toHaveBeenCalled();
  });

  it('should add a comment with required parameters', async () => {
    // Mock issue existence check
    const mockIssue = {
      url: Promise.resolve('https://linear.app/team/issue/TEAM-123/test-issue'),
    };

    (linearClient.issue as jest.Mock).mockResolvedValue(mockIssue);

    // Mock successful comment creation
    (linearClient.createComment as jest.Mock).mockResolvedValue({
      success: true,
      comment: {},
    });

    // Call the handler with required parameters
    const result = await linearAddCommentHandler({
      issueId: 'issue123',
      body: 'Test comment',
    });

    // Verify success response
    expect(result.isError).toBeFalsy();

    // Parse the response JSON
    const responseData = JSON.parse(result.content[0].text);

    // Verify response contains expected fields
    expect(responseData).toHaveProperty('body', 'Test comment');
    expect(responseData).toHaveProperty('url', 'https://linear.app/team/issue/TEAM-123/test-issue');
    expect(responseData).toHaveProperty('createdAt');

    // Ensure createComment was called with the correct parameters
    expect(linearClient.createComment).toHaveBeenCalledWith({
      issueId: 'issue123',
      body: 'Test comment',
    });
  });

  it('should add a comment with all optional parameters', async () => {
    // Mock issue existence check
    const mockIssue = {
      url: Promise.resolve('https://linear.app/team/issue/TEAM-123/test-issue'),
    };

    (linearClient.issue as jest.Mock).mockResolvedValue(mockIssue);

    // Mock successful comment creation
    (linearClient.createComment as jest.Mock).mockResolvedValue({
      success: true,
      comment: {},
    });

    // Call the handler with full parameters
    const result = await linearAddCommentHandler({
      issueId: 'issue123',
      body: 'Full comment with custom attributes',
      createAsUser: 'AI Assistant',
      displayIconUrl: 'https://example.com/avatar.png',
    });

    // Verify success response
    expect(result.isError).toBeFalsy();

    // Parse the response JSON
    const responseData = JSON.parse(result.content[0].text);

    // Verify response contains expected fields
    expect(responseData).toHaveProperty('body', 'Full comment with custom attributes');
    expect(responseData).toHaveProperty('url');
    expect(responseData).toHaveProperty('createdAt');

    // Ensure createComment was called with all parameters
    expect(linearClient.createComment).toHaveBeenCalledWith({
      issueId: 'issue123',
      body: 'Full comment with custom attributes',
      createAsUser: 'AI Assistant',
      displayIconUrl: 'https://example.com/avatar.png',
    });
  });

  it('should handle API errors gracefully', async () => {
    // Mock issue existence check
    (linearClient.issue as jest.Mock).mockResolvedValue({
      url: Promise.resolve('https://linear.app/team/issue/TEAM-123/test-issue'),
    });

    // Mock API error
    (linearClient.createComment as jest.Mock).mockRejectedValue(new Error('API connection failed'));

    // Call the handler with valid parameters
    const result = await linearAddCommentHandler({
      issueId: 'issue123',
      body: 'Error comment',
    });

    // Verify error response
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Error: API connection failed');

    // Ensure methods were called
    expect(linearClient.issue).toHaveBeenCalled();
    expect(linearClient.createComment).toHaveBeenCalled();
  });

  it('should handle failed comment creation', async () => {
    // Mock issue existence check
    (linearClient.issue as jest.Mock).mockResolvedValue({
      url: Promise.resolve('https://linear.app/team/issue/TEAM-123/test-issue'),
    });

    // Mock unsuccessful comment creation
    (linearClient.createComment as jest.Mock).mockResolvedValue({
      success: false,
      comment: null,
    });

    // Call the handler with valid parameters
    const result = await linearAddCommentHandler({
      issueId: 'issue123',
      body: 'Failed comment',
    });

    // Verify error response
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Error: Failed to create comment');

    // Ensure methods were called
    expect(linearClient.issue).toHaveBeenCalled();
    expect(linearClient.createComment).toHaveBeenCalled();
  });
});
