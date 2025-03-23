/**
 * Unit tests for the Linear Update Issue tool
 *
 * These tests verify that the tool properly validates input parameters,
 * handles error cases, and successfully updates issues when given valid inputs.
 */
import { linearUpdateIssueHandler } from './linear_update_issue.js';
import { linearClient } from '../linear.js';

// Mock the Linear client
jest.mock('../linear.js', () => ({
  linearClient: {
    issue: jest.fn(),
    updateIssue: jest.fn(),
  },
}));

describe('Linear Update Issue Tool', () => {
  // Reset mocks between tests
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return an error when issueId is missing', async () => {
    // Call the handler without an issueId
    const result = await linearUpdateIssueHandler({
      title: 'Updated Title',
    });

    // Verify error response
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Error: Issue ID is required');

    // Ensure update methods were not called
    expect(linearClient.issue).not.toHaveBeenCalled();
    expect(linearClient.updateIssue).not.toHaveBeenCalled();
  });

  it('should return an error when issue is not found', async () => {
    // Mock issue not found
    (linearClient.issue as jest.Mock).mockResolvedValue(null);

    // Call the handler with an invalid issueId
    const result = await linearUpdateIssueHandler({
      issueId: 'nonexistent123',
    });

    // Verify error response
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Error: Issue with ID nonexistent123 not found');

    // Ensure issue was checked but update was not called
    expect(linearClient.issue).toHaveBeenCalledWith('nonexistent123');
    expect(linearClient.updateIssue).not.toHaveBeenCalled();
  });

  it('should update an issue with only the title parameter', async () => {
    // Mock issue existence check
    (linearClient.issue as jest.Mock).mockResolvedValue({
      id: 'issue123',
      // ... other properties exist but aren't used for the existence check
    });

    // Mock successful issue update
    const updatedIssuePromise = Promise.resolve({
      id: 'issue123',
      title: 'Updated Title',
      description: 'Original description',
      url: 'https://linear.app/team/issue/TEAM-123/updated-title',
    });

    (linearClient.updateIssue as jest.Mock).mockResolvedValue({
      success: true,
      issue: updatedIssuePromise,
    });

    // Prepare mock for related objects to be await-ed in the handler
    const state = Promise.resolve({ name: 'In Progress' });
    const team = Promise.resolve({ name: 'Engineering' });
    const assignee = Promise.resolve({ name: 'John Doe' });

    // Add the then method to the promise to handle chaining in the handler
    updatedIssuePromise.then = jest
      .fn()
      .mockImplementationOnce(() => state)
      .mockImplementationOnce(() => team)
      .mockImplementationOnce(() => assignee);

    // Call the handler with just the title update
    const result = await linearUpdateIssueHandler({
      issueId: 'issue123',
      title: 'Updated Title',
    });

    // Verify success response
    expect(result.isError).toBeFalsy();

    // Parse the response JSON
    const responseData = JSON.parse(result.content[0].text);

    // Verify response contains expected fields
    expect(responseData).toHaveProperty('id', 'issue123');
    expect(responseData).toHaveProperty('title', 'Updated Title');
    expect(responseData).toHaveProperty('state', 'In Progress');
    expect(responseData).toHaveProperty('team', 'Engineering');
    expect(responseData).toHaveProperty('assignee', 'John Doe');

    // Ensure updateIssue was called with the correct parameters
    expect(linearClient.updateIssue).toHaveBeenCalledWith('issue123', {
      title: 'Updated Title',
    });
  });

  it('should update an issue with multiple parameters', async () => {
    // Mock issue existence check
    (linearClient.issue as jest.Mock).mockResolvedValue({
      id: 'issue123',
    });

    // Mock successful issue update
    const updatedIssuePromise = Promise.resolve({
      id: 'issue123',
      title: 'Full Update',
      description: 'New description',
      priority: 1,
      url: 'https://linear.app/team/issue/TEAM-123/full-update',
    });

    (linearClient.updateIssue as jest.Mock).mockResolvedValue({
      success: true,
      issue: updatedIssuePromise,
    });

    // Prepare mock for related objects to be await-ed in the handler
    const state = Promise.resolve({ name: 'In Progress' });
    const team = Promise.resolve({ name: 'Engineering' });
    const assignee = Promise.resolve({ name: 'John Doe' });

    // Add the then method to the promise to handle chaining in the handler
    updatedIssuePromise.then = jest
      .fn()
      .mockImplementationOnce(() => state)
      .mockImplementationOnce(() => team)
      .mockImplementationOnce(() => assignee);

    // Call the handler with multiple update parameters
    const result = await linearUpdateIssueHandler({
      issueId: 'issue123',
      title: 'Full Update',
      description: 'New description',
      stateId: 'state456',
      teamId: 'team789',
      assigneeId: 'user101',
      priority: 1,
      dueDate: '2023-12-31',
    });

    // Verify success response
    expect(result.isError).toBeFalsy();

    // Parse the response JSON
    const responseData = JSON.parse(result.content[0].text);

    // Verify response contains expected fields
    expect(responseData).toHaveProperty('id', 'issue123');
    expect(responseData).toHaveProperty('title', 'Full Update');
    expect(responseData).toHaveProperty('description', 'New description');
    expect(responseData).toHaveProperty('priority', 1);

    // Ensure updateIssue was called with all parameters
    expect(linearClient.updateIssue).toHaveBeenCalledWith('issue123', {
      title: 'Full Update',
      description: 'New description',
      stateId: 'state456',
      teamId: 'team789',
      assigneeId: 'user101',
      priority: 1,
      dueDate: '2023-12-31',
    });
  });

  it('should handle API errors gracefully', async () => {
    // Mock issue existence check
    (linearClient.issue as jest.Mock).mockResolvedValue({
      id: 'issue123',
    });

    // Mock API error during update
    (linearClient.updateIssue as jest.Mock).mockRejectedValue(new Error('API connection failed'));

    // Call the handler with valid parameters
    const result = await linearUpdateIssueHandler({
      issueId: 'issue123',
      title: 'Error Update',
    });

    // Verify error response
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Error: API connection failed');

    // Ensure issue existence was checked and updateIssue was called
    expect(linearClient.issue).toHaveBeenCalled();
    expect(linearClient.updateIssue).toHaveBeenCalled();
  });

  it('should handle failed issue update', async () => {
    // Mock issue existence check
    (linearClient.issue as jest.Mock).mockResolvedValue({
      id: 'issue123',
    });

    // Mock unsuccessful issue update
    (linearClient.updateIssue as jest.Mock).mockResolvedValue({
      success: false,
      issue: null,
    });

    // Call the handler with valid parameters
    const result = await linearUpdateIssueHandler({
      issueId: 'issue123',
      title: 'Failed Update',
    });

    // Verify error response
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Error: Failed to update issue');

    // Ensure issue existence was checked and updateIssue was called
    expect(linearClient.issue).toHaveBeenCalled();
    expect(linearClient.updateIssue).toHaveBeenCalled();
  });

  it('should handle missing updated issue data', async () => {
    // Mock issue existence check
    (linearClient.issue as jest.Mock).mockResolvedValue({
      id: 'issue123',
    });

    // Mock successful update but null issue return
    (linearClient.updateIssue as jest.Mock).mockResolvedValue({
      success: true,
      issue: null,
    });

    // Call the handler with valid parameters
    const result = await linearUpdateIssueHandler({
      issueId: 'issue123',
      title: 'Missing Data Update',
    });

    // Verify error response
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Error: Failed to retrieve updated issue data');

    // Ensure issue existence was checked and updateIssue was called
    expect(linearClient.issue).toHaveBeenCalled();
    expect(linearClient.updateIssue).toHaveBeenCalled();
  });
});
