import { linearClient } from '../linear.js';
import {
  linearProjectResourceHandler,
  linearProjectIssuesResourceHandler,
  LinearProjectDetailResponse,
  LinearProjectIssuesResponse,
  LinearProjectMilestonesResponse,
  linearProjectMilestonesResourceHandler,
} from './linear-project.js';

// Mock the Linear client
jest.mock('../linear.js', () => ({
  linearClient: {
    project: jest.fn(),
  },
}));

describe('Linear Project Resource Handlers', () => {
  // Common mock data
  const mockStatus = {
    id: Promise.resolve('status1'),
    name: Promise.resolve('Active'),
    color: Promise.resolve('#00ff00'),
    type: Promise.resolve('started'),
  };

  const mockLead = {
    id: Promise.resolve('user1'),
    name: Promise.resolve('John Doe'),
    displayName: Promise.resolve('John'),
  };

  const mockTeam1 = {
    id: 'team1',
    name: 'Engineering',
    key: 'ENG',
  };

  const mockTeam2 = {
    id: 'team2',
    name: 'Design',
    key: 'DSG',
  };

  const mockMember1 = {
    id: 'member1',
    name: 'Jane Smith',
    displayName: 'Jane',
  };

  const mockMember2 = {
    id: 'member2',
    name: 'Bob Johnson',
    displayName: 'Bob',
  };

  // Mock project
  const mockProject = {
    id: 'project123',
    name: 'Test Project',
    description: 'A test project',
    color: '#ff0000',
    icon: '🚀',
    progress: 0.5,
    status: Promise.resolve(mockStatus),
    lead: Promise.resolve(mockLead),
    teams: jest.fn().mockResolvedValue({
      nodes: [mockTeam1, mockTeam2],
    }),
    members: jest.fn().mockResolvedValue({
      nodes: [mockMember1, mockMember2],
    }),
    startDate: '2023-01-01',
    targetDate: '2023-12-31',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-02'),
    issues: jest.fn(),
  };

  // Mock issues
  const mockIssue1 = {
    id: 'issue1',
    title: 'Fix bug',
    identifier: 'PROJ-1',
    description: 'Need to fix a critical bug',
    state: Promise.resolve({ name: 'Todo' }),
    priority: 1,
    assignee: Promise.resolve({
      id: 'user1',
      name: 'John Doe',
      displayName: 'John',
    }),
    url: 'https://linear.app/team/issue/PROJ-1',
    createdAt: new Date('2023-01-05'),
    updatedAt: new Date('2023-01-06'),
  };

  const mockIssue2 = {
    id: 'issue2',
    title: 'Implement feature',
    identifier: 'PROJ-2',
    description: 'Implement new feature',
    state: Promise.resolve({ name: 'In Progress' }),
    priority: 2,
    assignee: Promise.resolve(null),
    url: 'https://linear.app/team/issue/PROJ-2',
    createdAt: new Date('2023-01-07'),
    updatedAt: new Date('2023-01-08'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (linearClient.project as jest.Mock).mockResolvedValue(mockProject);
    mockProject.issues.mockResolvedValue({
      nodes: [mockIssue1, mockIssue2],
    });
  });

  describe('Linear Project Resource Handler', () => {
    it('should return project details when given a valid project ID', async () => {
      const result = await linearProjectResourceHandler({ projectId: 'project123' });

      expect(linearClient.project).toHaveBeenCalledWith('project123');
      expect(result.isError).toBe(false);

      const data = result.data as LinearProjectDetailResponse;
      expect(data).toMatchObject({
        id: 'project123',
        name: 'Test Project',
        description: 'A test project',
        color: '#ff0000',
        icon: '🚀',
        progress: 0.5,
        startDate: '2023-01-01',
        targetDate: '2023-12-31',
      });

      // Check nested objects
      expect(data.status).toBeDefined();
      expect(data.status?.name).toBe('Active');
      expect(data.status?.color).toBe('#00ff00');

      expect(data.lead).toBeDefined();
      expect(data.lead?.name).toBe('John Doe');
      expect(data.lead?.displayName).toBe('John');

      // Check teams and members
      expect(data.teams).toHaveLength(2);
      expect(data.teams[0].key).toBe('ENG');
      expect(data.teams[1].name).toBe('Design');

      expect(data.members).toHaveLength(2);
      expect(data.members[0].displayName).toBe('Jane');
      expect(data.members[1].name).toBe('Bob Johnson');

      // Check dates
      expect(data.createdAt).toEqual(new Date('2023-01-01'));
      expect(data.updatedAt).toEqual(new Date('2023-01-02'));
    });

    it('should return an error when project ID is missing', async () => {
      const result = await linearProjectResourceHandler({});

      expect(linearClient.project).not.toHaveBeenCalled();
      expect(result.isError).toBe(true);
      expect(result.errorMessage).toBe('Invalid project ID');
      expect(result.data).toBeNull();
    });

    it('should return an error when project is not found', async () => {
      (linearClient.project as jest.Mock).mockResolvedValue(null);

      const result = await linearProjectResourceHandler({ projectId: 'nonexistent' });

      expect(linearClient.project).toHaveBeenCalledWith('nonexistent');
      expect(result.isError).toBe(true);
      expect(result.errorMessage).toBe('Project with ID nonexistent not found');
      expect(result.data).toBeNull();
    });

    it('should handle missing related entities', async () => {
      const mockPartialProject = {
        ...mockProject,
        status: Promise.resolve(null),
        lead: Promise.resolve(null),
        teams: jest.fn().mockResolvedValue({ nodes: [] }),
        members: jest.fn().mockResolvedValue({ nodes: [] }),
      };
      (linearClient.project as jest.Mock).mockResolvedValue(mockPartialProject);

      const result = await linearProjectResourceHandler({ projectId: 'project123' });

      expect(result.isError).toBe(false);
      const data = result.data as LinearProjectDetailResponse;
      expect(data.status).toBeUndefined();
      expect(data.lead).toBeUndefined();
      expect(data.teams).toHaveLength(0);
      expect(data.members).toHaveLength(0);
    });

    it('should handle API errors gracefully', async () => {
      (linearClient.project as jest.Mock).mockRejectedValue(new Error('API error'));

      const result = await linearProjectResourceHandler({ projectId: 'project123' });

      expect(linearClient.project).toHaveBeenCalledWith('project123');
      expect(result.isError).toBe(true);
      expect(result.errorMessage).toBe('Error: API error');
      expect(result.data).toBeNull();
    });
  });

  describe('Linear Project Issues Resource Handler', () => {
    it('should return project issues when given a valid project ID', async () => {
      const result = await linearProjectIssuesResourceHandler({ projectId: 'project123' });

      expect(linearClient.project).toHaveBeenCalledWith('project123');
      expect(mockProject.issues).toHaveBeenCalledWith({ first: 50 });
      expect(result.isError).toBe(false);

      const data = result.data as LinearProjectIssuesResponse;

      // Check project data
      expect(data.project).toMatchObject({
        id: 'project123',
        name: 'Test Project',
        description: 'A test project',
      });

      // Check issues
      expect(data.issues).toHaveLength(2);

      // Check first issue
      expect(data.issues[0]).toMatchObject({
        id: 'issue1',
        title: 'Fix bug',
        identifier: 'PROJ-1',
        description: 'Need to fix a critical bug',
        status: 'Todo',
        priority: 1,
      });
      expect(data.issues[0].assignee).toBeDefined();
      expect(data.issues[0].assignee?.name).toBe('John Doe');

      // Check second issue
      expect(data.issues[1]).toMatchObject({
        id: 'issue2',
        title: 'Implement feature',
        identifier: 'PROJ-2',
        status: 'In Progress',
        priority: 2,
      });
      expect(data.issues[1].assignee).toBeUndefined();
    });

    it('should return an error when project ID is missing', async () => {
      const result = await linearProjectIssuesResourceHandler({});

      expect(linearClient.project).not.toHaveBeenCalled();
      expect(result.isError).toBe(true);
      expect(result.errorMessage).toBe('Invalid project ID');
      expect(result.data).toBeNull();
    });

    it('should return an error when project is not found', async () => {
      (linearClient.project as jest.Mock).mockResolvedValue(null);

      const result = await linearProjectIssuesResourceHandler({ projectId: 'nonexistent' });

      expect(linearClient.project).toHaveBeenCalledWith('nonexistent');
      expect(result.isError).toBe(true);
      expect(result.errorMessage).toBe('Project with ID nonexistent not found');
      expect(result.data).toBeNull();
    });

    it('should handle empty issues list', async () => {
      mockProject.issues.mockResolvedValue({ nodes: [] });

      const result = await linearProjectIssuesResourceHandler({ projectId: 'project123' });

      expect(result.isError).toBe(false);
      const data = result.data as LinearProjectIssuesResponse;
      expect(data.issues).toHaveLength(0);
    });

    it('should handle API errors gracefully', async () => {
      mockProject.issues.mockRejectedValue(new Error('API error'));

      const result = await linearProjectIssuesResourceHandler({ projectId: 'project123' });

      expect(linearClient.project).toHaveBeenCalledWith('project123');
      expect(result.isError).toBe(true);
      expect(result.errorMessage).toBe('Error: API error');
      expect(result.data).toBeNull();
    });
  });

  describe('linear-project-milestones resource', () => {
    it('should return project milestones for a valid project ID', async () => {
      const result = await linearProjectMilestonesResourceHandler({ projectId: 'project123' });

      expect(result.isError).toBe(false);
      expect(result.data).toBeDefined();

      const data = result.data as LinearProjectMilestonesResponse;
      expect(data.project.id).toBe('project123');
      expect(data.project.name).toBe('Test Project');

      expect(data.milestones).toHaveLength(3);

      // Check first milestone
      expect(data.milestones[0].name).toBe('Alpha Release');
      expect(data.milestones[0].status).toBe('completed');
      expect(data.milestones[0].issues.total).toBe(5);
      expect(data.milestones[0].issues.completed).toBe(5);

      // Check second milestone
      expect(data.milestones[1].name).toBe('Beta Release');
      expect(data.milestones[1].status).toBe('inProgress');
      expect(data.milestones[1].issues.total).toBe(8);
      expect(data.milestones[1].issues.completed).toBe(5);

      // Check statistics
      expect(data.stats.total).toBe(3);
      expect(data.stats.byStatus.completed).toBe(1);
      expect(data.stats.byStatus.inProgress).toBe(1);
      expect(data.stats.byStatus.planned).toBe(1);
      expect(data.stats.completed).toBe(1);
    });

    it('should handle invalid project ID', async () => {
      const result = await linearProjectMilestonesResourceHandler({ projectId: '' });

      expect(result.isError).toBe(true);
      expect(result.errorMessage).toBe('Invalid project ID');
      expect(result.data).toBeNull();
    });

    it('should handle non-existent project ID', async () => {
      (linearClient.project as jest.Mock).mockResolvedValue(null);
      const result = await linearProjectMilestonesResourceHandler({ projectId: 'nonexistent' });

      expect(result.isError).toBe(true);
      expect(result.errorMessage).toBe('Project with ID nonexistent not found');
      expect(result.data).toBeNull();
    });
  });
});
