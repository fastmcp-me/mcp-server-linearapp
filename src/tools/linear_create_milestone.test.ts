import {
  linearCreateMilestoneHandler,
  linearCreateMilestoneTool,
} from './linear_create_milestone.js';

// Mock registerTool function
jest.mock('../registry.js', () => ({
  registerTool: jest.fn(),
}));

describe('linear_create_milestone tool', () => {
  const handler = linearCreateMilestoneHandler;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a milestone with required parameters', async () => {
    // Call with required parameters
    const result = await handler({
      name: 'Test Milestone',
      projectId: 'project1',
      targetDate: '2023-12-31',
    });

    // Parse the response
    const response = JSON.parse(result.content[0].text);

    // Verify success
    expect(response.success).toBe(true);

    // Verify milestone data
    expect(response.milestone).toHaveProperty('id');
    expect(response.milestone.name).toBe('Test Milestone');
    expect(response.milestone.projectId).toBe('project1');
    expect(response.milestone.targetDate).toBe('2023-12-31');
    expect(response.milestone.status).toBe('planned');
    expect(response.milestone.description).toBe('');
    expect(response.milestone.sortOrder).toBe(0);
  });

  it('should create a milestone with all parameters', async () => {
    // Call with all parameters
    const result = await handler({
      name: 'Complete Milestone',
      projectId: 'project2',
      targetDate: '2024-06-30',
      description: 'This is a detailed description',
      sortOrder: 5,
    });

    // Parse the response
    const response = JSON.parse(result.content[0].text);

    // Verify success
    expect(response.success).toBe(true);

    // Verify milestone data
    expect(response.milestone).toHaveProperty('id');
    expect(response.milestone.name).toBe('Complete Milestone');
    expect(response.milestone.projectId).toBe('project2');
    expect(response.milestone.targetDate).toBe('2024-06-30');
    expect(response.milestone.description).toBe('This is a detailed description');
    expect(response.milestone.sortOrder).toBe(5);
  });

  it('should fail with missing required parameters', async () => {
    // Test missing name
    const resultNoName = await handler({
      projectId: 'project1',
      targetDate: '2023-12-31',
    });
    expect(resultNoName.isError).toBe(true);
    expect(resultNoName.content[0].text).toContain('Milestone name is required');

    // Test missing projectId
    const resultNoProject = await handler({
      name: 'Test Milestone',
      targetDate: '2023-12-31',
    });
    expect(resultNoProject.isError).toBe(true);
    expect(resultNoProject.content[0].text).toContain('Project ID is required');

    // Test missing targetDate
    const resultNoTargetDate = await handler({
      name: 'Test Milestone',
      projectId: 'project1',
    });
    expect(resultNoTargetDate.isError).toBe(true);
    expect(resultNoTargetDate.content[0].text).toContain('Target date is required');
  });

  it('should fail with invalid date format', async () => {
    // Test invalid date format
    const result = await handler({
      name: 'Test Milestone',
      projectId: 'project1',
      targetDate: 'not-a-date',
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Target date must be in ISO format');
  });

  it('should fail with non-existent project ID', async () => {
    // Test non-existent project ID
    const result = await handler({
      name: 'Test Milestone',
      projectId: 'nonexistent',
      targetDate: '2023-12-31',
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Project with ID nonexistent not found');
  });

  it('should export the correct tool definition', () => {
    // Verify tool definition
    expect(linearCreateMilestoneTool.name).toBe('linear_create_milestone');
    expect(linearCreateMilestoneTool.inputSchema.properties).toHaveProperty('name');
    expect(linearCreateMilestoneTool.inputSchema.properties).toHaveProperty('projectId');
    expect(linearCreateMilestoneTool.inputSchema.properties).toHaveProperty('targetDate');
    expect(linearCreateMilestoneTool.inputSchema.properties).toHaveProperty('description');
    expect(linearCreateMilestoneTool.inputSchema.properties).toHaveProperty('sortOrder');
    expect(linearCreateMilestoneTool.inputSchema.required).toContain('name');
    expect(linearCreateMilestoneTool.inputSchema.required).toContain('projectId');
    expect(linearCreateMilestoneTool.inputSchema.required).toContain('targetDate');
  });
});
