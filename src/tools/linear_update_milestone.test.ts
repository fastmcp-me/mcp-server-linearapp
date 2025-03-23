import {
  linearUpdateMilestoneHandler,
  linearUpdateMilestoneTool,
} from './linear_update_milestone.js';

// Mock console.error to prevent noise in test output
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('linear_update_milestone tool', () => {
  it('should update a milestone with name parameter', async () => {
    const result = await linearUpdateMilestoneHandler({
      id: 'milestone1',
      name: 'Updated Alpha Release',
    });

    expect(result.content).toHaveLength(1);
    expect(result.isError).toBeUndefined();

    const parsedResponse = JSON.parse(result.content[0].text);
    expect(parsedResponse.success).toBe(true);
    expect(parsedResponse.milestone.id).toBe('milestone1');
    expect(parsedResponse.milestone.name).toBe('Updated Alpha Release');
    // Other properties should remain unchanged
    expect(parsedResponse.milestone.description).toBe(
      'Initial feature-complete release for internal testing'
    );
    expect(parsedResponse.milestone.status).toBe('completed');
  });

  it('should update a milestone with multiple parameters', async () => {
    const result = await linearUpdateMilestoneHandler({
      id: 'milestone2',
      name: 'Improved Beta Release',
      description: 'Enhanced public beta testing phase',
      status: 'completed',
      targetDate: '2023-08-15',
    });

    expect(result.content).toHaveLength(1);
    expect(result.isError).toBeUndefined();

    const parsedResponse = JSON.parse(result.content[0].text);
    expect(parsedResponse.success).toBe(true);
    expect(parsedResponse.milestone.id).toBe('milestone2');
    expect(parsedResponse.milestone.name).toBe('Improved Beta Release');
    expect(parsedResponse.milestone.description).toBe('Enhanced public beta testing phase');
    expect(parsedResponse.milestone.status).toBe('completed');
    expect(parsedResponse.milestone.targetDate).toBe('2023-08-15');
  });

  it('should update a milestone with sortOrder parameter', async () => {
    const result = await linearUpdateMilestoneHandler({
      id: 'milestone3',
      sortOrder: 5,
    });

    expect(result.content).toHaveLength(1);
    expect(result.isError).toBeUndefined();

    const parsedResponse = JSON.parse(result.content[0].text);
    expect(parsedResponse.success).toBe(true);
    expect(parsedResponse.milestone.id).toBe('milestone3');
    expect(parsedResponse.milestone.sortOrder).toBe(5);
    // Other properties should remain unchanged
    expect(parsedResponse.milestone.name).toBe('Final Release');
  });

  it('should fail when milestone ID is missing', async () => {
    const result = await linearUpdateMilestoneHandler({
      name: 'New Name',
    });

    expect(result.content).toHaveLength(1);
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Milestone ID is required');
  });

  it('should fail when no update fields are provided', async () => {
    const result = await linearUpdateMilestoneHandler({
      id: 'milestone1',
    });

    expect(result.content).toHaveLength(1);
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('At least one field to update must be provided');
  });

  it('should fail with invalid date format', async () => {
    const result = await linearUpdateMilestoneHandler({
      id: 'milestone1',
      targetDate: '15/06/2023', // Invalid format
    });

    expect(result.content).toHaveLength(1);
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Target date must be in ISO format');
  });

  it('should fail with invalid status value', async () => {
    const result = await linearUpdateMilestoneHandler({
      id: 'milestone1',
      status: 'invalid',
    });

    expect(result.content).toHaveLength(1);
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Status must be one of');
  });

  it('should fail with non-existent milestone ID', async () => {
    const result = await linearUpdateMilestoneHandler({
      id: 'nonexistent',
      name: 'New Name',
    });

    expect(result.content).toHaveLength(1);
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Milestone with ID nonexistent not found');
  });

  it('should export the correct tool definition', () => {
    expect(linearUpdateMilestoneTool).toEqual({
      name: 'linear_update_milestone',
      description: 'Update an existing milestone in Linear',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Milestone ID to update',
          },
          name: {
            type: 'string',
            description: 'New milestone name',
          },
          targetDate: {
            type: 'string',
            description: 'New target date (ISO format, e.g., "2023-12-31")',
          },
          description: {
            type: 'string',
            description: 'New milestone description',
          },
          status: {
            type: 'string',
            description: 'New milestone status (e.g., "planned", "inProgress", "completed")',
          },
          sortOrder: {
            type: 'number',
            description: 'New position in milestone list',
          },
        },
        required: ['id'],
      },
    });
  });
});
