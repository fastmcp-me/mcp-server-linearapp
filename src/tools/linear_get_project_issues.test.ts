import { linearGetProjectIssuesHandler } from './linear_get_project_issues.js';
import { linearClient } from '../linear.js';

// Mock the Linear client
jest.mock('../linear.js', () => ({
  linearClient: {
    project: jest.fn(),
  },
}));

describe('Linear Get Project Issues Tool', () => {
  // Mock project data
  const mockProject = {
    id: 'project123',
    name: 'Project Alpha',
    status: Promise.resolve({ name: 'Active' }),
    issues: jest.fn(),
  };

  // Mock issue data
  const mockIssue1 = {
    id: Promise.resolve('issue1'),
    identifier: Promise.resolve('ENG-101'),
    title: Promise.resolve('Fix bug in API'),
    description: Promise.resolve('The API endpoint is returning 500 errors'),
    state: Promise.resolve({ name: 'Todo' }),
    assignee: Promise.resolve({ name: 'John Doe' }),
    priority: Promise.resolve(1),
    url: Promise.resolve('https://linear.app/project/issue/ENG-101'),
    createdAt: Promise.resolve('2023-01-01T00:00:00.000Z'),
    updatedAt: Promise.resolve('2023-01-02T00:00:00.000Z'),
  };

  const mockIssue2 = {
    id: Promise.resolve('issue2'),
    identifier: Promise.resolve('ENG-102'),
    title: Promise.resolve('Implement new feature'),
    description: Promise.resolve('Add authentication support'),
    state: Promise.resolve({ name: 'In Progress' }),
    assignee: Promise.resolve(null),
    priority: Promise.resolve(2),
    url: Promise.resolve('https://linear.app/project/issue/ENG-102'),
    createdAt: Promise.resolve('2023-01-03T00:00:00.000Z'),
    updatedAt: Promise.resolve('2023-01-04T00:00:00.000Z'),
  };

  const mockIssue3 = {
    id: Promise.resolve('issue3'),
    identifier: Promise.resolve('ENG-103'),
    title: Promise.resolve('Update documentation'),
    description: Promise.resolve('Update API documentation'),
    state: Promise.resolve({ name: 'Todo' }),
    assignee: Promise.resolve({ name: 'Jane Smith' }),
    priority: Promise.resolve(3),
    url: Promise.resolve('https://linear.app/project/issue/ENG-103'),
    createdAt: Promise.resolve('2023-01-05T00:00:00.000Z'),
    updatedAt: Promise.resolve('2023-01-06T00:00:00.000Z'),
  };

  // Mock issues response
  const mockIssuesResponse = {
    nodes: [mockIssue1, mockIssue2, mockIssue3],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    (linearClient.project as jest.Mock).mockResolvedValue(mockProject);
    mockProject.issues.mockResolvedValue(mockIssuesResponse);
  });

  it('should return an error when projectId is missing', async () => {
    const result = await linearGetProjectIssuesHandler({});

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Error: Project ID is required');
    expect(linearClient.project).not.toHaveBeenCalled();
  });

  it('should return an error when project is not found', async () => {
    (linearClient.project as jest.Mock).mockResolvedValue(null);

    const result = await linearGetProjectIssuesHandler({
      projectId: 'nonexistent',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Error: Project with ID nonexistent not found');
    expect(linearClient.project).toHaveBeenCalledWith('nonexistent');
  });

  it('should fetch project issues with default parameters', async () => {
    const result = await linearGetProjectIssuesHandler({
      projectId: 'project123',
    });

    expect(result.isError).toBeUndefined();
    expect(mockProject.issues).toHaveBeenCalledWith({
      first: 50,
      includeArchived: false,
    });

    const parsedResult = JSON.parse(result.content[0].text);
    expect(parsedResult.id).toBe('project123');
    expect(parsedResult.name).toBe('Project Alpha');
    expect(parsedResult.status).toBe('Active');
    expect(parsedResult.issues).toHaveLength(3);
    expect(parsedResult.issues[0].identifier).toBe('ENG-101');
    expect(parsedResult.issues[1].identifier).toBe('ENG-102');
    expect(parsedResult.issues[2].identifier).toBe('ENG-103');
  });

  it('should handle custom limit and includeArchived parameters', async () => {
    const result = await linearGetProjectIssuesHandler({
      projectId: 'project123',
      limit: 10,
      includeArchived: true,
    });

    expect(result.isError).toBeUndefined();
    expect(mockProject.issues).toHaveBeenCalledWith({
      first: 10,
      includeArchived: true,
    });
  });

  it('should filter issues by status', async () => {
    const result = await linearGetProjectIssuesHandler({
      projectId: 'project123',
      status: 'Todo',
    });

    expect(result.isError).toBeUndefined();

    const parsedResult = JSON.parse(result.content[0].text);
    expect(parsedResult.issues).toHaveLength(2);
    expect(parsedResult.issues[0].identifier).toBe('ENG-101');
    expect(parsedResult.issues[1].identifier).toBe('ENG-103');
  });

  it('should filter issues by priority', async () => {
    const result = await linearGetProjectIssuesHandler({
      projectId: 'project123',
      priority: 1,
    });

    expect(result.isError).toBeUndefined();

    const parsedResult = JSON.parse(result.content[0].text);
    expect(parsedResult.issues).toHaveLength(1);
    expect(parsedResult.issues[0].identifier).toBe('ENG-101');
  });

  it('should combine status and priority filters', async () => {
    const result = await linearGetProjectIssuesHandler({
      projectId: 'project123',
      status: 'Todo',
      priority: 3,
    });

    expect(result.isError).toBeUndefined();

    const parsedResult = JSON.parse(result.content[0].text);
    expect(parsedResult.issues).toHaveLength(1);
    expect(parsedResult.issues[0].identifier).toBe('ENG-103');
  });

  it('should handle when issues response is null', async () => {
    mockProject.issues.mockResolvedValue(null);

    const result = await linearGetProjectIssuesHandler({
      projectId: 'project123',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Error: Failed to fetch project issues');
  });

  it('should handle empty issues list', async () => {
    mockProject.issues.mockResolvedValue({ nodes: [] });

    const result = await linearGetProjectIssuesHandler({
      projectId: 'project123',
    });

    expect(result.isError).toBeUndefined();

    const parsedResult = JSON.parse(result.content[0].text);
    expect(parsedResult.issues).toHaveLength(0);
  });

  it('should handle API errors gracefully', async () => {
    mockProject.issues.mockRejectedValue(new Error('API error'));

    const result = await linearGetProjectIssuesHandler({
      projectId: 'project123',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Error: API error');
  });
});
