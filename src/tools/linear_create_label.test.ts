import { linearCreateLabelHandler } from './linear_create_label.js';
import { linearClient } from '../linear.js';

// Mock the Linear client
jest.mock('../linear.js', () => ({
  linearClient: {
    team: jest.fn(),
  },
}));

describe('linear_create_label tool', () => {
  // Clear all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Mock team data
  const mockTeam = {
    id: 'team1',
    name: 'Engineering',
    key: 'ENG',
  };

  it('should create a simple label successfully', async () => {
    // Setup the mocks
    (linearClient.team as jest.Mock).mockResolvedValue(mockTeam);

    // Call the handler
    const result = await linearCreateLabelHandler({
      teamId: 'team1',
      name: 'Bug',
      color: '#FF0000',
      description: 'Software bug',
    });

    // Verify team was checked
    expect(linearClient.team).toHaveBeenCalledWith('team1');

    // Verify result format
    expect(result.isError).toBe(false);
    expect(result.content[0].type).toBe('text');

    // Parse the JSON response
    const response = JSON.parse(result.content[0].text);

    // Verify the response structure
    expect(response).toHaveProperty('label');
    expect(response).toHaveProperty('team');

    // Verify the label data
    expect(response.label.name).toBe('Bug');
    expect(response.label.color).toBe('#FF0000');
    expect(response.label.description).toBe('Software bug');
    expect(response.label.teamId).toBe('team1');

    // Verify team info
    expect(response.team.id).toBe('team1');
    expect(response.team.name).toBe('Engineering');
  });

  it('should create a nested label with a parent', async () => {
    // Setup the mocks
    (linearClient.team as jest.Mock).mockResolvedValue(mockTeam);

    // Call the handler with parentId="parent1" which our mock recognizes
    const result = await linearCreateLabelHandler({
      teamId: 'team1',
      name: 'UI Feature',
      color: '#0000FF',
      description: 'UI-related feature',
      parentId: 'parent1',
    });

    // Verify team was checked
    expect(linearClient.team).toHaveBeenCalledWith('team1');

    // Verify result format
    expect(result.isError).toBe(false);

    // Parse the JSON response
    const response = JSON.parse(result.content[0].text);

    // Verify the label data
    expect(response.label.name).toBe('UI Feature');
    expect(response.label.parentId).toBe('parent1');
    expect(response.label.parentName).toBe('MockParent');
  });

  it('should validate required parameters', async () => {
    // Test missing teamId
    let result = await linearCreateLabelHandler({
      name: 'Bug',
    } as any);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Team ID is required');

    // Test missing name
    result = await linearCreateLabelHandler({
      teamId: 'team1',
    } as any);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Label name is required');
  });

  it('should handle team not found', async () => {
    // Setup the mock to return null for team
    (linearClient.team as jest.Mock).mockResolvedValue(null);

    // Call the handler
    const result = await linearCreateLabelHandler({
      teamId: 'nonexistent',
      name: 'Bug',
    });

    // Verify team was attempted to be fetched
    expect(linearClient.team).toHaveBeenCalledWith('nonexistent');

    // Verify result is an error
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Team with ID nonexistent not found');
  });

  it('should handle parent label not found', async () => {
    // Setup the mocks
    (linearClient.team as jest.Mock).mockResolvedValue(mockTeam);

    // Call the handler with a non-existent parent ID
    const result = await linearCreateLabelHandler({
      teamId: 'team1',
      name: 'UI Feature',
      parentId: 'nonexistent',
    });

    // Verify team was checked
    expect(linearClient.team).toHaveBeenCalledWith('team1');

    // Verify result is an error
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Parent label with ID nonexistent not found');
  });

  it('should handle API errors gracefully', async () => {
    // Setup the mock to throw an error
    (linearClient.team as jest.Mock).mockRejectedValue(new Error('API error'));

    // Call the handler
    const result = await linearCreateLabelHandler({
      teamId: 'team1',
      name: 'Bug',
    });

    // Verify result is an error
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Error: API error');
  });
});
