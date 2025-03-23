import { linearUpdateLabelHandler } from './linear_update_label.js';
import { linearClient } from '../linear.js';

// Mock the Linear client
jest.mock('../linear.js', () => ({
  linearClient: {
    team: jest.fn(),
  },
}));

describe('linear_update_label tool', () => {
  // Clear all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update a label name successfully', async () => {
    // Mock team data returned by linearClient.team
    (linearClient.team as jest.Mock).mockResolvedValue({
      id: 'team1',
      name: 'Engineering',
      key: 'ENG',
    });

    // Call the handler with a valid labelId ('label1' is recognized by our mock)
    const result = await linearUpdateLabelHandler({
      labelId: 'label1',
      name: 'Critical Bug',
      description: 'Critical software bug',
    });

    // Verify result format
    expect(result.isError).toBe(false);
    expect(result.content[0].type).toBe('text');

    // Parse the JSON response
    const response = JSON.parse(result.content[0].text);

    // Verify the response structure
    expect(response).toHaveProperty('label');
    expect(response).toHaveProperty('team');

    // Verify the label data
    expect(response.label.name).toBe('Critical Bug');
    expect(response.label.description).toBe('Critical software bug');
    expect(response.label.teamId).toBe('team1');
  });

  it('should update a label parent successfully', async () => {
    // Call the handler with a valid labelId and parentId ('parent1' is recognized by our mock)
    const result = await linearUpdateLabelHandler({
      labelId: 'label1',
      parentId: 'parent1',
    });

    // Verify result format
    expect(result.isError).toBe(false);

    // Parse the JSON response
    const response = JSON.parse(result.content[0].text);

    // Verify the parent label data
    expect(response.label.parentId).toBe('parent1');
    expect(response.label.parentName).toBe('Parent Label');
  });

  it('should archive a label successfully', async () => {
    // Call the handler with a valid labelId
    const result = await linearUpdateLabelHandler({
      labelId: 'label1',
      archived: true,
    });

    // Parse the JSON response
    const response = JSON.parse(result.content[0].text);

    // Verify the archived status
    expect(response.label.archived).toBe(true);
    expect(response.label.archivedAt).not.toBeNull();
  });

  it('should validate required parameters', async () => {
    // Test missing labelId
    const result = await linearUpdateLabelHandler({} as any);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Label ID is required');
  });

  it('should require at least one update field', async () => {
    // Test with no update fields
    const result = await linearUpdateLabelHandler({
      labelId: 'label1',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('At least one field to update must be provided');
  });

  it('should handle label not found', async () => {
    // Call the handler with an invalid labelId
    const result = await linearUpdateLabelHandler({
      labelId: 'nonexistent',
      name: 'New Name',
    });

    // Verify result is an error
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Label with ID nonexistent not found');
  });

  it('should handle parent label not found', async () => {
    // Call the handler with a valid labelId but invalid parentId
    const result = await linearUpdateLabelHandler({
      labelId: 'label1',
      parentId: 'nonexistent',
    });

    // Verify result is an error
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Parent label with ID nonexistent not found');
  });

  it('should prevent circular label references', async () => {
    // Call the handler with the same ID for label and parent
    const result = await linearUpdateLabelHandler({
      labelId: 'label1',
      parentId: 'label1',
    });

    // Verify result is an error
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('A label cannot be its own parent');
  });

  it('should handle API errors gracefully', async () => {
    // Setup the mock to throw an error
    (linearClient.team as jest.Mock).mockRejectedValue(new Error('API error'));

    // Call the handler with our special trigger ID
    const result = await linearUpdateLabelHandler({
      labelId: 'causeError',
      name: 'New Name',
    });

    // Verify result is an error
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Error: API error');
  });
});
