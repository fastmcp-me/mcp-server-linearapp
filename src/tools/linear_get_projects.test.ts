import { linearGetProjectsHandler } from './linear_get_projects.js';
import { linearClient } from '../linear.js';

// Mock the Linear client
jest.mock('../linear.js', () => ({
  linearClient: {
    projects: jest.fn(),
    team: jest.fn(),
  },
}));

describe('Linear Get Projects Tool', () => {
  // Mock team object
  const mockTeam = {
    id: 'team123',
    name: Promise.resolve('Engineering'),
    projects: jest.fn(),
  };

  // Mock project statuses
  const mockActiveStatus = {
    id: Promise.resolve('status1'),
    name: Promise.resolve('Active'),
    color: Promise.resolve('#00ff00'),
    type: Promise.resolve('started'),
  };

  const mockCompletedStatus = {
    id: Promise.resolve('status2'),
    name: Promise.resolve('Completed'),
    color: Promise.resolve('#0000ff'),
    type: Promise.resolve('completed'),
  };

  // Mock project team data
  const mockTeamData = {
    id: Promise.resolve('team123'),
    name: Promise.resolve('Engineering'),
    key: Promise.resolve('ENG'),
  };

  // Mock projects
  const mockProject1 = {
    id: 'project1',
    name: 'Project Alpha',
    description: 'First test project',
    status: Promise.resolve(mockActiveStatus),
    teams: jest.fn().mockResolvedValue({
      nodes: [mockTeamData],
    }),
    startDate: '2023-01-01',
    targetDate: '2023-12-31',
    url: 'https://linear.app/team/project/project1',
    progress: 0.5,
    priority: 1,
    color: '#ff0000',
    icon: '🚀',
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-02T00:00:00.000Z',
  };

  const mockProject2 = {
    id: 'project2',
    name: 'Project Beta',
    description: 'Second test project',
    status: Promise.resolve(mockCompletedStatus),
    teams: jest.fn().mockResolvedValue({
      nodes: [mockTeamData],
    }),
    startDate: '2023-02-01',
    targetDate: '2023-11-30',
    url: 'https://linear.app/team/project/project2',
    progress: 1.0,
    priority: 2,
    color: '#00ff00',
    icon: '📝',
    createdAt: '2023-02-01T00:00:00.000Z',
    updatedAt: '2023-02-02T00:00:00.000Z',
  };

  const mockProject3 = {
    id: 'project3',
    name: 'Project Gamma',
    description: 'Third test project',
    status: Promise.resolve(mockActiveStatus),
    teams: jest.fn().mockResolvedValue({
      nodes: [],
    }),
    startDate: '2023-03-01',
    targetDate: '2023-10-31',
    url: 'https://linear.app/team/project/project3',
    progress: 0.25,
    priority: 3,
    color: '#0000ff',
    icon: '🔧',
    createdAt: '2023-03-01T00:00:00.000Z',
    updatedAt: '2023-03-02T00:00:00.000Z',
  };

  // Mock projects response
  const mockAllProjectsResponse = {
    nodes: [mockProject1, mockProject2, mockProject3],
  };

  const mockTeamProjectsResponse = {
    nodes: [mockProject1, mockProject2],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    (linearClient.projects as jest.Mock).mockResolvedValue(mockAllProjectsResponse);
    (linearClient.team as jest.Mock).mockResolvedValue(mockTeam);
    mockTeam.projects.mockResolvedValue(mockTeamProjectsResponse);
  });

  it('should fetch all projects when no teamId is provided', async () => {
    const result = await linearGetProjectsHandler({});

    expect(result.isError).toBeUndefined();
    expect(linearClient.projects).toHaveBeenCalledWith({
      first: 50,
      includeArchived: false,
    });
    expect(linearClient.team).not.toHaveBeenCalled();

    const parsedContent = JSON.parse(result.content[0].text);
    expect(parsedContent).toHaveLength(3);
    expect(parsedContent[0].id).toBe('project1');
    expect(parsedContent[1].id).toBe('project2');
    expect(parsedContent[2].id).toBe('project3');
  });

  it('should fetch team projects when teamId is provided', async () => {
    const result = await linearGetProjectsHandler({
      teamId: 'team123',
    });

    expect(result.isError).toBeUndefined();
    expect(linearClient.team).toHaveBeenCalledWith('team123');
    expect(mockTeam.projects).toHaveBeenCalledWith({
      first: 50,
      includeArchived: false,
    });
    expect(linearClient.projects).not.toHaveBeenCalled();

    const parsedContent = JSON.parse(result.content[0].text);
    expect(parsedContent).toHaveLength(2);
    expect(parsedContent[0].id).toBe('project1');
    expect(parsedContent[1].id).toBe('project2');
  });

  it('should return an error when team is not found', async () => {
    (linearClient.team as jest.Mock).mockResolvedValue(null);

    const result = await linearGetProjectsHandler({
      teamId: 'nonexistent',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Error: Team with ID nonexistent not found');
    expect(linearClient.team).toHaveBeenCalledWith('nonexistent');
    expect(mockTeam.projects).not.toHaveBeenCalled();
  });

  it('should respect custom limit and includeArchived parameters', async () => {
    const result = await linearGetProjectsHandler({
      limit: 10,
      includeArchived: true,
    });

    expect(result.isError).toBeUndefined();
    expect(linearClient.projects).toHaveBeenCalledWith({
      first: 10,
      includeArchived: true,
    });
  });

  it('should filter projects by status', async () => {
    const result = await linearGetProjectsHandler({
      status: 'Active',
    });

    expect(result.isError).toBeUndefined();

    const parsedContent = JSON.parse(result.content[0].text);
    expect(parsedContent).toHaveLength(2);
    expect(parsedContent[0].id).toBe('project1');
    expect(parsedContent[1].id).toBe('project3');
  });

  it('should handle status filtering with team ID', async () => {
    const result = await linearGetProjectsHandler({
      teamId: 'team123',
      status: 'Completed',
    });

    expect(result.isError).toBeUndefined();

    const parsedContent = JSON.parse(result.content[0].text);
    expect(parsedContent).toHaveLength(1);
    expect(parsedContent[0].id).toBe('project2');
    expect(parsedContent[0].status).toBe('Completed');
  });

  it('should handle when no projects match the status filter', async () => {
    const result = await linearGetProjectsHandler({
      status: 'Canceled',
    });

    expect(result.isError).toBeUndefined();

    const parsedContent = JSON.parse(result.content[0].text);
    expect(parsedContent).toHaveLength(0);
  });

  it('should handle when projects response is null', async () => {
    (linearClient.projects as jest.Mock).mockResolvedValue(null);

    const result = await linearGetProjectsHandler({});

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Error: Failed to fetch projects');
  });

  it('should handle empty projects list', async () => {
    (linearClient.projects as jest.Mock).mockResolvedValue({ nodes: [] });

    const result = await linearGetProjectsHandler({});

    expect(result.isError).toBeUndefined();

    const parsedContent = JSON.parse(result.content[0].text);
    expect(parsedContent).toHaveLength(0);
  });

  it('should handle API errors gracefully', async () => {
    (linearClient.projects as jest.Mock).mockRejectedValue(new Error('API error'));

    const result = await linearGetProjectsHandler({});

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Error: API error');
  });

  it('should handle team projects API errors gracefully', async () => {
    mockTeam.projects.mockRejectedValue(new Error('Team API error'));

    const result = await linearGetProjectsHandler({
      teamId: 'team123',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Error: Team API error');
  });
});
