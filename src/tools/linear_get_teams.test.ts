/**
 * Unit tests for the Linear Get Teams tool
 *
 * These tests verify that the tool properly retrieves team data
 * and handles error cases appropriately.
 */
import { linearGetTeamsHandler } from './linear_get_teams.js';
import { linearClient } from '../linear.js';

// Mock the Linear client
jest.mock('../linear.js', () => ({
  linearClient: {
    teams: jest.fn(),
  },
}));

describe('Linear Get Teams Tool', () => {
  // Reset mocks between tests
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return teams data when available', async () => {
    // Mock teams data
    const mockTeams = {
      nodes: [
        {
          id: 'team123',
          name: 'Engineering',
          key: 'ENG',
          description: 'Engineering team',
        },
        {
          id: 'team456',
          name: 'Design',
          key: 'DES',
          description: 'Design team',
        },
        {
          id: 'team789',
          name: 'Marketing',
          key: 'MKT',
          description: null, // Test handling of null description
        },
      ],
    };

    // Set up the mock teams response
    (linearClient.teams as jest.Mock).mockResolvedValue(mockTeams);

    // Call the handler
    const result = await linearGetTeamsHandler({});

    // Verify success response
    expect(result.isError).toBeFalsy();

    // Parse the response JSON
    const responseData = JSON.parse(result.content[0].text);

    // Verify response is an array with correct length
    expect(Array.isArray(responseData)).toBe(true);
    expect(responseData).toHaveLength(3);

    // Verify team data is correctly structured
    expect(responseData[0]).toEqual({
      id: 'team123',
      name: 'Engineering',
      key: 'ENG',
      description: 'Engineering team',
    });

    expect(responseData[1]).toEqual({
      id: 'team456',
      name: 'Design',
      key: 'DES',
      description: 'Design team',
    });

    // Check that null description is converted to empty string
    expect(responseData[2]).toEqual({
      id: 'team789',
      name: 'Marketing',
      key: 'MKT',
      description: '',
    });

    // Ensure teams method was called
    expect(linearClient.teams).toHaveBeenCalled();
  });

  it('should handle when teams data is not available', async () => {
    // Set up the mock teams response to return null
    (linearClient.teams as jest.Mock).mockResolvedValue(null);

    // Call the handler
    const result = await linearGetTeamsHandler({});

    // Verify error response
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Error: Failed to fetch teams');

    // Ensure teams method was called
    expect(linearClient.teams).toHaveBeenCalled();
  });

  it('should handle API errors gracefully', async () => {
    // Set up the mock teams method to throw an error
    (linearClient.teams as jest.Mock).mockRejectedValue(new Error('API connection failed'));

    // Call the handler
    const result = await linearGetTeamsHandler({});

    // Verify error response
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Error: API connection failed');

    // Ensure teams method was called
    expect(linearClient.teams).toHaveBeenCalled();
  });
});
