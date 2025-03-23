import { linearGetMilestonesHandler, linearGetMilestonesTool } from './linear_get_milestones.js';

// Mock registerTool function
jest.mock('../registry.js', () => ({
  registerTool: jest.fn(),
}));

describe('linear_get_milestones tool', () => {
  const handler = linearGetMilestonesHandler;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return milestones with correct structure', async () => {
    // Make a request with no filters
    const result = await handler({});

    // Parse the response
    const response = JSON.parse(result.content[0].text);

    // Check structure
    expect(response).toHaveProperty('milestones');
    expect(response).toHaveProperty('pageInfo');
    expect(response).toHaveProperty('totalCount');

    // Check milestones structure
    expect(Array.isArray(response.milestones)).toBe(true);
    if (response.milestones.length > 0) {
      const milestone = response.milestones[0];
      expect(milestone).toHaveProperty('id');
      expect(milestone).toHaveProperty('name');
      expect(milestone).toHaveProperty('description');
      expect(milestone).toHaveProperty('targetDate');
      expect(milestone).toHaveProperty('status');
      expect(milestone).toHaveProperty('projectId');
      expect(milestone).toHaveProperty('projectName');
    }
  });

  it('should filter milestones by project ID', async () => {
    // Filter for project1 milestones
    const result = await handler({ projectId: 'project1' });
    const response = JSON.parse(result.content[0].text);

    // All returned milestones should belong to project1
    response.milestones.forEach((milestone: any) => {
      expect(milestone.projectId).toBe('project1');
    });

    // There should be multiple milestones for project1
    expect(response.milestones.length).toBeGreaterThan(0);
  });

  it('should include archived milestones when specified', async () => {
    // Request with includeArchived set to true
    const resultWithArchived = await handler({ includeArchived: true });
    const responseWithArchived = JSON.parse(resultWithArchived.content[0].text);

    // Request with includeArchived not set (defaults to false)
    const resultWithoutArchived = await handler({});
    const responseWithoutArchived = JSON.parse(resultWithoutArchived.content[0].text);

    // Should have more milestones when including archived
    expect(responseWithArchived.milestones.length).toBeGreaterThan(
      responseWithoutArchived.milestones.length
    );

    // Check for presence of archived milestones
    const hasArchivedMilestone = responseWithArchived.milestones.some(
      (m: any) => m.archivedAt !== null
    );
    expect(hasArchivedMilestone).toBe(true);

    // Without includeArchived, there should be no archived milestones
    const hasArchivedMilestoneInFiltered = responseWithoutArchived.milestones.some(
      (m: any) => m.archivedAt !== null
    );
    expect(hasArchivedMilestoneInFiltered).toBe(false);
  });

  it('should limit the number of results', async () => {
    // Request with limit of 2
    const result = await handler({ limit: 2 });
    const response = JSON.parse(result.content[0].text);

    // Should have exactly 2 milestones
    expect(response.milestones.length).toBe(2);

    // PageInfo should indicate there are more results
    expect(response.pageInfo.hasNextPage).toBe(true);
  });

  it('should handle invalid project ID', async () => {
    // Request with invalid project ID
    const result = await handler({ projectId: 'nonexistent' });

    // Should return an error
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Project with ID nonexistent not found');
  });

  it('should export the correct tool definition', () => {
    // Verify tool definition
    expect(linearGetMilestonesTool.name).toBe('linear_get_milestones');
    expect(linearGetMilestonesTool.inputSchema.properties).toHaveProperty('projectId');
    expect(linearGetMilestonesTool.inputSchema.properties).toHaveProperty('includeArchived');
    expect(linearGetMilestonesTool.inputSchema.properties).toHaveProperty('limit');
  });
});
