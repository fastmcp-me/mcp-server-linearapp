/**
 * Unit tests for the Linear Create Issue tool
 *
 * These tests verify that the tool properly validates inputs,
 * handles error cases, and successfully creates issues when given valid inputs.
 */
import { linearCreateIssueHandler } from './linear_create_issue.js';
import { linearClient } from '../linear.js';

// Mock the Linear client
jest.mock('../linear.js', () => ({
  linearClient: {
    createIssue: jest.fn(),
  },
}));

describe('Linear Create Issue Tool', () => {
  // Reset mocks between tests
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return an error when teamId is missing', async () => {
    // Call the handler without a teamId
    const result = await linearCreateIssueHandler({
      title: 'Test Issue',
    });

    // Verify error response
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Error: Team ID is required');

    // Ensure createIssue was not called
    expect(linearClient.createIssue).not.toHaveBeenCalled();
  });

  it('should return an error when title is missing', async () => {
    // Call the handler without a title
    const result = await linearCreateIssueHandler({
      teamId: 'team123',
    });

    // Verify error response
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Error: Title is required');

    // Ensure createIssue was not called
    expect(linearClient.createIssue).not.toHaveBeenCalled();
  });

  it('should create an issue with required parameters', async () => {
    // Mock successful issue creation
    const mockIssuePromise = Promise.resolve({
      id: 'issue123',
      title: 'Test Issue',
      identifier: 'TEAM-123',
      url: 'https://linear.app/team/issue/TEAM-123/test-issue',
    });

    (linearClient.createIssue as jest.Mock).mockResolvedValue({
      success: true,
      issue: mockIssuePromise,
    });

    // Call the handler with required parameters
    const result = await linearCreateIssueHandler({
      teamId: 'team123',
      title: 'Test Issue',
    });

    // Verify success response
    expect(result.isError).toBeFalsy();

    // Parse the response JSON
    const responseData = JSON.parse(result.content[0].text);

    // Verify response contains expected fields
    expect(responseData).toHaveProperty('id', 'issue123');
    expect(responseData).toHaveProperty('title', 'Test Issue');
    expect(responseData).toHaveProperty('identifier', 'TEAM-123');
    expect(responseData).toHaveProperty('url');
    expect(responseData).toHaveProperty('createdAt');

    // Ensure createIssue was called with the correct parameters
    expect(linearClient.createIssue).toHaveBeenCalledWith({
      teamId: 'team123',
      title: 'Test Issue',
    });
  });

  it('should create an issue with all optional parameters', async () => {
    // Mock successful issue creation
    const mockIssuePromise = Promise.resolve({
      id: 'issue123',
      title: 'Full Issue',
      identifier: 'TEAM-123',
      url: 'https://linear.app/team/issue/TEAM-123/full-issue',
    });

    (linearClient.createIssue as jest.Mock).mockResolvedValue({
      success: true,
      issue: mockIssuePromise,
    });

    // Call the handler with full parameters
    const result = await linearCreateIssueHandler({
      teamId: 'team123',
      title: 'Full Issue',
      description: 'This is a test issue with full details',
      stateId: 'state123',
      assigneeId: 'user123',
      priority: 1,
      labelIds: ['label1', 'label2'],
    });

    // Verify success response
    expect(result.isError).toBeFalsy();

    // Parse the response JSON
    const responseData = JSON.parse(result.content[0].text);

    // Verify response contains expected fields
    expect(responseData).toHaveProperty('id', 'issue123');
    expect(responseData).toHaveProperty('title', 'Full Issue');

    // Ensure createIssue was called with all parameters
    expect(linearClient.createIssue).toHaveBeenCalledWith({
      teamId: 'team123',
      title: 'Full Issue',
      description: 'This is a test issue with full details',
      stateId: 'state123',
      assigneeId: 'user123',
      priority: 1,
      labelIds: ['label1', 'label2'],
    });
  });

  it('should handle API errors gracefully', async () => {
    // Mock API error
    (linearClient.createIssue as jest.Mock).mockRejectedValue(new Error('API connection failed'));

    // Call the handler with valid parameters
    const result = await linearCreateIssueHandler({
      teamId: 'team123',
      title: 'Error Issue',
    });

    // Verify error response
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Error: API connection failed');

    // Ensure createIssue was called
    expect(linearClient.createIssue).toHaveBeenCalled();
  });

  it('should handle failed issue creation', async () => {
    // Mock unsuccessful issue creation
    (linearClient.createIssue as jest.Mock).mockResolvedValue({
      success: false,
      issue: null,
    });

    // Call the handler with valid parameters
    const result = await linearCreateIssueHandler({
      teamId: 'team123',
      title: 'Failed Issue',
    });

    // Verify error response
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Error: Failed to create issue');

    // Ensure createIssue was called
    expect(linearClient.createIssue).toHaveBeenCalled();
  });
});
