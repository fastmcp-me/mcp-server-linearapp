import { linearGetProjectHandler } from './linear_get_project.js';
import { linearClient } from '../linear.js';

// Mock the Linear client
jest.mock('../linear.js', () => ({
  linearClient: {
    project: jest.fn(),
  },
}));

describe('Linear Get Project Tool', () => {
  // Mock project data
  const mockTeamData = {
    id: Promise.resolve('team123'),
    name: Promise.resolve('Engineering'),
    key: Promise.resolve('ENG'),
  };

  const mockStatus = {
    id: Promise.resolve('status1'),
    name: Promise.resolve('Active'),
    color: Promise.resolve('#00ff00'),
    type: Promise.resolve('started'),
  };

  const mockCreator = {
    id: Promise.resolve('user1'),
    name: Promise.resolve('Jane Smith'),
    displayName: Promise.resolve('Jane'),
  };

  const mockLead = {
    id: Promise.resolve('user2'),
    name: Promise.resolve('John Doe'),
    displayName: Promise.resolve('John'),
  };

  const mockProject = {
    id: 'project123',
    name: 'Test Project',
    description: 'A project for testing',
    content: 'Project content description',
    url: 'https://linear.app/team/project/project123',
    color: '#ff0000',
    icon: '🔍',
    status: Promise.resolve(mockStatus),
    teams: jest.fn().mockResolvedValue({
      nodes: [mockTeamData],
    }),
    creator: Promise.resolve(mockCreator),
    lead: Promise.resolve(mockLead),
    progress: 0.75,
    startDate: '2023-01-01',
    targetDate: '2023-12-31',
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-02T00:00:00.000Z',
    completedAt: null,
    canceledAt: null,
    archivedAt: null,
    priority: 1,
    slugId: 'test-project',
    sortOrder: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock
    (linearClient.project as jest.Mock).mockResolvedValue(mockProject);
  });

  it('should return an error when projectId is missing', async () => {
    const result = await linearGetProjectHandler({});

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Error: Project ID is required');
    expect(linearClient.project).not.toHaveBeenCalled();
  });

  it('should return an error when project is not found', async () => {
    (linearClient.project as jest.Mock).mockResolvedValue(null);

    const result = await linearGetProjectHandler({
      projectId: 'nonexistent',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Error: Project with ID nonexistent not found');
    expect(linearClient.project).toHaveBeenCalledWith('nonexistent');
  });

  it('should retrieve full project details when given a valid projectId', async () => {
    const result = await linearGetProjectHandler({
      projectId: 'project123',
    });

    expect(result.isError).toBeUndefined();
    expect(linearClient.project).toHaveBeenCalledWith('project123');

    const parsedResult = JSON.parse(result.content[0].text);
    expect(parsedResult.id).toBe('project123');
    expect(parsedResult.name).toBe('Test Project');
    expect(parsedResult.description).toBe('A project for testing');
    expect(parsedResult.url).toBe('https://linear.app/team/project/project123');

    // Check nested objects
    expect(parsedResult.status).toEqual({
      id: 'status1',
      name: 'Active',
      color: '#00ff00',
      type: 'started',
    });

    expect(parsedResult.team).toEqual({
      id: 'team123',
      name: 'Engineering',
      key: 'ENG',
    });

    expect(parsedResult.creator).toEqual({
      id: 'user1',
      name: 'Jane Smith',
      displayName: 'Jane',
    });

    expect(parsedResult.lead).toEqual({
      id: 'user2',
      name: 'John Doe',
      displayName: 'John',
    });

    // Check dates and other fields
    expect(parsedResult.progress).toBe(0.75);
    expect(parsedResult.startDate).toBe('2023-01-01');
    expect(parsedResult.targetDate).toBe('2023-12-31');
    expect(parsedResult.priority).toBe(1);
  });

  it('should handle project with missing related entities', async () => {
    // Create a project with null relationships
    const mockProjectWithNulls = {
      ...mockProject,
      status: Promise.resolve(null),
      teams: jest.fn().mockResolvedValue({ nodes: [] }),
      creator: Promise.resolve(null),
      lead: Promise.resolve(null),
    };

    (linearClient.project as jest.Mock).mockResolvedValue(mockProjectWithNulls);

    const result = await linearGetProjectHandler({
      projectId: 'project123',
    });

    expect(result.isError).toBeUndefined();

    const parsedResult = JSON.parse(result.content[0].text);
    expect(parsedResult.id).toBe('project123');
    expect(parsedResult.status).toBeNull();
    expect(parsedResult.team).toBeNull();
    expect(parsedResult.creator).toBeNull();
    expect(parsedResult.lead).toBeNull();
  });

  it('should handle API errors gracefully', async () => {
    (linearClient.project as jest.Mock).mockRejectedValue(new Error('API error'));

    const result = await linearGetProjectHandler({
      projectId: 'project123',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Error: API error');
  });
});
