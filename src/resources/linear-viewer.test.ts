import { linearClient } from '../linear.js';
import {
  linearViewerResourceHandler,
  LinearViewerResponse,
  linearViewerTeamsResourceHandler,
  linearViewerProjectsResourceHandler,
  linearViewerAssignedResourceHandler,
} from './linear-viewer.js';

// Mock the Linear client
jest.mock('../linear.js', () => ({
  linearClient: {
    get viewer() {
      return undefined; // Will be defined in each test via Object.defineProperty
    },
  },
}));

describe('Linear Viewer Resources', () => {
  // Clear all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('linearViewerResourceHandler', () => {
    const mockViewer = {
      id: 'user123',
      name: 'John Doe',
      displayName: 'Johnny',
      email: 'john@example.com',
      active: true,
    };

    it('should return viewer data', async () => {
      // Setup mocks
      Object.defineProperty(linearClient, 'viewer', {
        get: jest.fn().mockReturnValue(mockViewer),
        configurable: true,
      });

      // Call the handler
      const result = await linearViewerResourceHandler({});

      // Verify the result
      expect(result.isError).toBe(false);

      // Parse response
      const responseData = JSON.parse((result.data as any).text) as LinearViewerResponse;

      // Check viewer data
      expect(responseData).toMatchObject({
        id: 'user123',
        name: 'John Doe',
        displayName: 'Johnny',
        email: 'john@example.com',
        active: true,
      });
    });

    it('should return an error when viewer is not available', async () => {
      // Setup mocks
      Object.defineProperty(linearClient, 'viewer', {
        get: jest.fn().mockReturnValue(null),
        configurable: true,
      });

      // Call the handler
      const result = await linearViewerResourceHandler({});

      // Verify the result
      expect(result.isError).toBe(true);
      expect(result.errorMessage).toBe('Failed to fetch viewer');
      expect(result.data).toBeNull();
    });

    it('should handle API errors gracefully', async () => {
      // Setup mocks to throw error when accessing the viewer property
      Object.defineProperty(linearClient, 'viewer', {
        get: jest.fn().mockImplementation(() => {
          throw new Error('API error');
        }),
        configurable: true,
      });

      // Call the handler
      const result = await linearViewerResourceHandler({});

      // Verify the result
      expect(result.isError).toBe(true);
      expect(result.errorMessage).toBe('Error: API error');
      expect(result.data).toBeNull();
    });
  });

  // Mock user for the tests
  const mockViewer = {
    id: 'user123',
    name: 'John Doe',
    displayName: 'Johnny',
    teams: jest.fn(),
    assignedIssues: jest.fn(),
  };

  // Mock teams for the tests
  const mockTeam1 = {
    id: 'team1',
    name: 'Engineering',
    key: 'ENG',
    description: 'Engineering team',
    icon: 'code',
    color: '#0000FF',
    projects: jest.fn(),
  };

  const mockTeam2 = {
    id: 'team2',
    name: 'Design',
    key: 'DSG',
    description: null,
    icon: 'paint',
    color: '#FF0000',
    projects: jest.fn(),
  };

  // Mock projects
  const mockProject1 = {
    id: 'proj1',
    name: 'Project Alpha',
    description: 'First project',
    startDate: '2023-01-01',
    targetDate: '2023-03-01',
    lead: Promise.resolve({
      id: 'user123',
      name: 'John Doe',
      displayName: 'Johnny',
    }),
    status: Promise.resolve({ name: 'In Progress' }),
    members: jest.fn(),
  };

  const mockProject2 = {
    id: 'proj2',
    name: 'Project Beta',
    description: 'Second project',
    startDate: '2023-02-01',
    targetDate: '2023-04-01',
    lead: Promise.resolve(null),
    status: Promise.resolve(null),
    members: jest.fn(),
  };

  // Mock issues
  const mockIssue1 = {
    id: 'issue1',
    title: 'Fix bug',
    identifier: 'ENG-123',
    description: 'Need to fix a critical bug',
    priority: 1,
    state: Promise.resolve({ name: 'Todo' }),
    url: 'https://linear.app/company/issue/ENG-123',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-02'),
  };

  const mockIssue2 = {
    id: 'issue2',
    title: 'Implement feature',
    identifier: 'DSG-456',
    description: null,
    priority: 2,
    state: Promise.resolve({ name: 'In Progress' }),
    url: 'https://linear.app/company/issue/DSG-456',
    createdAt: new Date('2023-01-03'),
    updatedAt: new Date('2023-01-04'),
  };

  describe('linearViewerTeamsResourceHandler', () => {
    it('should return teams data for the current viewer', async () => {
      // Setup mock responses
      mockViewer.teams.mockResolvedValue({
        nodes: [mockTeam1, mockTeam2],
      });

      Object.defineProperty(linearClient, 'viewer', {
        get: jest.fn().mockReturnValue(mockViewer),
        configurable: true,
      });

      // Call the handler
      const result = await linearViewerTeamsResourceHandler({});

      // Verify the result
      expect(result.isError).toBe(false);
      expect(mockViewer.teams).toHaveBeenCalled();

      // Parse the response JSON
      const responseData = JSON.parse((result.data as any).text);

      // Check response structure
      expect(responseData).toHaveProperty('teams');
      expect(responseData).toHaveProperty('user');

      // Check teams data
      expect(responseData.teams).toHaveLength(2);
      expect(responseData.teams[0]).toMatchObject({
        id: 'team1',
        name: 'Engineering',
        key: 'ENG',
        description: 'Engineering team',
        icon: 'code',
        color: '#0000FF',
      });

      // Check that null description is preserved
      expect(responseData.teams[1].description).toBeNull();

      // Check user data
      expect(responseData.user).toMatchObject({
        id: 'user123',
        name: 'John Doe',
        displayName: 'Johnny',
      });
    });

    it('should return an error when viewer is not available', async () => {
      // Setup mock responses
      Object.defineProperty(linearClient, 'viewer', {
        get: jest.fn().mockReturnValue(null),
        configurable: true,
      });

      // Call the handler
      const result = await linearViewerTeamsResourceHandler({});

      // Verify the result
      expect(result.isError).toBe(true);
      expect(result.errorMessage).toBe('Failed to fetch current user');
      expect(result.data).toBeNull();
    });

    it('should handle API errors gracefully', async () => {
      // Setup mock responses
      Object.defineProperty(linearClient, 'viewer', {
        get: jest.fn().mockReturnValue(mockViewer),
        configurable: true,
      });

      mockViewer.teams.mockRejectedValue(new Error('API failure'));

      // Call the handler
      const result = await linearViewerTeamsResourceHandler({});

      // Verify the result
      expect(result.isError).toBe(true);
      expect(result.errorMessage).toBe('Error: API failure');
      expect(result.data).toBeNull();
    });

    it('should handle empty teams list', async () => {
      // Setup mock responses
      mockViewer.teams.mockResolvedValue({
        nodes: [],
      });

      Object.defineProperty(linearClient, 'viewer', {
        get: jest.fn().mockReturnValue(mockViewer),
        configurable: true,
      });

      // Call the handler
      const result = await linearViewerTeamsResourceHandler({});

      // Verify the result
      expect(result.isError).toBe(false);

      // Parse the response JSON
      const responseData = JSON.parse((result.data as any).text);

      // Check empty teams array
      expect(responseData.teams).toEqual([]);
    });
  });

  describe('linearViewerAssignedResourceHandler', () => {
    it('should return assigned issues for the current viewer', async () => {
      // Setup mock responses
      mockViewer.assignedIssues.mockResolvedValue({
        nodes: [mockIssue1, mockIssue2],
      });

      Object.defineProperty(linearClient, 'viewer', {
        get: jest.fn().mockReturnValue(mockViewer),
        configurable: true,
      });

      // Call the handler
      const result = await linearViewerAssignedResourceHandler({});

      // Verify the result
      expect(result.isError).toBe(false);
      expect(mockViewer.assignedIssues).toHaveBeenCalledWith({ first: 50 });

      // Parse the response JSON
      const responseData = JSON.parse((result.data as any).text);

      // Check response structure
      expect(responseData).toHaveProperty('assignedIssues');
      expect(responseData).toHaveProperty('user');

      // Check issues data
      expect(responseData.assignedIssues).toHaveLength(2);
      expect(responseData.assignedIssues[0]).toMatchObject({
        id: 'issue1',
        title: 'Fix bug',
        identifier: 'ENG-123',
        description: 'Need to fix a critical bug',
        status: 'Todo',
        priority: 1,
      });

      // Verify null handling for description
      expect(responseData.assignedIssues[1].description).toBeNull();
    });

    it('should return an error when viewer is not available', async () => {
      // Setup mock responses
      Object.defineProperty(linearClient, 'viewer', {
        get: jest.fn().mockReturnValue(null),
        configurable: true,
      });

      // Call the handler
      const result = await linearViewerAssignedResourceHandler({});

      // Verify the result
      expect(result.isError).toBe(true);
      expect(result.errorMessage).toBe('Failed to fetch current user');
      expect(result.data).toBeNull();
    });

    it('should handle API errors gracefully', async () => {
      // Setup mock responses
      Object.defineProperty(linearClient, 'viewer', {
        get: jest.fn().mockReturnValue(mockViewer),
        configurable: true,
      });

      mockViewer.assignedIssues.mockRejectedValue(new Error('API failure'));

      // Call the handler
      const result = await linearViewerAssignedResourceHandler({});

      // Verify the result
      expect(result.isError).toBe(true);
      expect(result.errorMessage).toBe('Error: API failure');
      expect(result.data).toBeNull();
    });

    it('should handle empty issues list', async () => {
      // Setup mock responses
      mockViewer.assignedIssues.mockResolvedValue({
        nodes: [],
      });

      Object.defineProperty(linearClient, 'viewer', {
        get: jest.fn().mockReturnValue(mockViewer),
        configurable: true,
      });

      // Call the handler
      const result = await linearViewerAssignedResourceHandler({});

      // Verify the result
      expect(result.isError).toBe(false);

      // Parse the response JSON
      const responseData = JSON.parse((result.data as any).text);

      // Check empty issues array
      expect(responseData.assignedIssues).toEqual([]);
    });
  });

  describe('linearViewerProjectsResourceHandler', () => {
    beforeEach(() => {
      // Project members setup
      const memberNodes = [{ id: 'user123' }];
      mockProject1.members.mockResolvedValue({ nodes: memberNodes });
      mockProject2.members.mockResolvedValue({ nodes: memberNodes });

      // Team projects setup
      mockTeam1.projects.mockResolvedValue({
        nodes: [mockProject1],
      });

      mockTeam2.projects.mockResolvedValue({
        nodes: [mockProject2],
      });

      // Viewer teams setup
      mockViewer.teams.mockResolvedValue({
        nodes: [mockTeam1, mockTeam2],
      });

      // Set viewer
      Object.defineProperty(linearClient, 'viewer', {
        get: jest.fn().mockReturnValue(mockViewer),
        configurable: true,
      });
    });

    it('should return projects for the current viewer', async () => {
      // Call the handler
      const result = await linearViewerProjectsResourceHandler({});

      // Verify the result
      expect(result.isError).toBe(false);
      expect(mockViewer.teams).toHaveBeenCalled();
      expect(mockTeam1.projects).toHaveBeenCalledWith({ first: 20 });
      expect(mockProject1.members).toHaveBeenCalled();

      // Parse the response JSON
      const responseData = JSON.parse((result.data as any).text);

      // Check response structure
      expect(responseData).toHaveProperty('projects');
      expect(responseData).toHaveProperty('user');

      // Should have two projects
      expect(responseData.projects).toHaveLength(2);

      // Verify project data
      expect(responseData.projects[0]).toMatchObject({
        id: 'proj1',
        name: 'Project Alpha',
        description: 'First project',
        state: 'In Progress',
        startDate: '2023-01-01',
        targetDate: '2023-03-01',
      });

      // Verify lead data
      expect(responseData.projects[0].lead).toMatchObject({
        id: 'user123',
        name: 'John Doe',
      });

      // Verify project with no lead or status
      expect(responseData.projects[1].lead).toBeNull();
      expect(responseData.projects[1].state).toBe('Unknown');
    });

    it('should return an error when viewer is not available', async () => {
      // Setup mock responses
      Object.defineProperty(linearClient, 'viewer', {
        get: jest.fn().mockReturnValue(null),
        configurable: true,
      });

      // Call the handler
      const result = await linearViewerProjectsResourceHandler({});

      // Verify the result
      expect(result.isError).toBe(true);
      expect(result.errorMessage).toBe('Failed to fetch current user');
      expect(result.data).toBeNull();
    });

    it('should handle API errors gracefully', async () => {
      // Setup mock responses for this specific test (overriding the beforeEach)
      Object.defineProperty(linearClient, 'viewer', {
        get: jest.fn().mockReturnValue(mockViewer),
        configurable: true,
      });

      mockViewer.teams.mockRejectedValue(new Error('API failure'));

      // Call the handler
      const result = await linearViewerProjectsResourceHandler({});

      // Verify the result
      expect(result.isError).toBe(true);
      expect(result.errorMessage).toBe('Error: API failure');
      expect(result.data).toBeNull();
    });
  });
});
