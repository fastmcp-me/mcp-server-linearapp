import { linearGetLabelsHandler } from './linear_get_labels.js';
import { linearClient } from '../linear.js';

// Mock the Linear client
jest.mock('../linear.js', () => ({
  linearClient: {
    team: jest.fn(),
  },
}));

// Define interface for label in test
interface TestLabel {
  id: string;
  name: string;
  color: string;
  description: string;
  teamId: string;
  teamName: string;
  teamKey: string;
  archived: boolean;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  parentId: string | null;
  parentName: string | null;
}

describe('linear_get_labels tool', () => {
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

  describe('without team filter', () => {
    it('should fetch all labels', async () => {
      // Call the handler without any arguments
      const result = await linearGetLabelsHandler({});

      // Verify result format
      expect(result.isError).toBe(false);
      expect(result.content[0].type).toBe('text');

      // Parse the JSON response
      const response = JSON.parse(result.content[0].text);

      // Verify the response structure
      expect(response).toHaveProperty('labels');
      expect(response).toHaveProperty('pagination');
      expect(response.pagination.totalCount).toBeGreaterThan(0);

      // Check that we got non-archived labels by default
      const hasArchivedLabels = response.labels.some((label: TestLabel) => label.archived);
      expect(hasArchivedLabels).toBe(false);
    });

    it('should include archived labels when specified', async () => {
      // Call the handler with includeArchived = true
      const result = await linearGetLabelsHandler({
        includeArchived: true,
      });

      // Parse the JSON response
      const response = JSON.parse(result.content[0].text);

      // Check that we got archived labels
      const hasArchivedLabels = response.labels.some((label: TestLabel) => label.archived);
      expect(hasArchivedLabels).toBe(true);
    });
  });

  describe('with team filter', () => {
    it('should fetch labels for a specific team', async () => {
      // Setup the mock to return a valid team
      (linearClient.team as jest.Mock).mockResolvedValue(mockTeam);

      // Call the handler with a teamId
      const result = await linearGetLabelsHandler({
        teamId: 'team1',
      });

      // Verify team was checked
      expect(linearClient.team).toHaveBeenCalledWith('team1');

      // Verify result format
      expect(result.isError).toBe(false);

      // Parse the JSON response
      const response = JSON.parse(result.content[0].text);

      // Verify the response structure
      expect(response).toHaveProperty('labels');
      expect(response).toHaveProperty('team');
      expect(response.team.id).toBe('team1');

      // Verify all labels belong to the requested team
      expect(response.labels.every((label: TestLabel) => label.teamId === 'team1')).toBe(true);
    });

    it('should handle team not found', async () => {
      // Setup the mock to return null for a non-existent team
      (linearClient.team as jest.Mock).mockResolvedValue(null);

      // Call the handler with a non-existent teamId
      const result = await linearGetLabelsHandler({
        teamId: 'nonexistent',
      });

      // Verify team was checked
      expect(linearClient.team).toHaveBeenCalledWith('nonexistent');

      // Verify result is an error
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Team with ID nonexistent not found');
    });
  });

  it('should handle API errors gracefully', async () => {
    // Setup the mock to throw an error
    (linearClient.team as jest.Mock).mockRejectedValue(new Error('API error'));

    // Call the handler with a teamId to trigger the API call
    const result = await linearGetLabelsHandler({
      teamId: 'team1',
    });

    // Verify result is an error
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Error: API error');
  });
});
