import { linearMilestoneResourceHandler } from './linear-milestone.js';
import { ResourceArgs, ResourceResponse } from '../registry.js';

// Define the expected response type
interface MilestoneResponse {
  milestone: {
    id: string;
    name: string;
    description: string;
    targetDate: string;
    status: string;
    sortOrder: number;
    projectId: string;
    projectName: string;
    createdAt: string;
    updatedAt: string;
    archivedAt: string | null;
  };
  project: {
    id: string;
    name: string;
  };
  issues: Array<{
    id: string;
    title: string;
    identifier: string;
    status: string;
    priority: number;
    assignee: {
      id: string;
      name: string;
      email: string;
    } | null;
  }>;
  stats: {
    totalIssues: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    percentComplete: number;
  };
}

describe('linear-milestone resource', () => {
  it('should return milestone details for a valid milestone ID', async () => {
    // Call the handler with a valid milestone URI
    const args: ResourceArgs = { uri: 'linear-milestone:///milestone1' };
    const result = (await linearMilestoneResourceHandler(
      args
    )) as ResourceResponse<MilestoneResponse>;

    // Verify result format
    expect(result.isError).toBeUndefined();
    expect(result.data).toBeDefined();

    // Verify the response structure
    expect(result.data.milestone).toBeDefined();
    expect(result.data.project).toBeDefined();
    expect(result.data.issues).toBeDefined();
    expect(result.data.stats).toBeDefined();

    // Verify the milestone data
    expect(result.data.milestone.id).toBe('milestone1');
    expect(result.data.milestone.name).toBe('Alpha Release');
    expect(result.data.milestone.projectId).toBe('project1');
    expect(result.data.milestone.status).toBe('completed');

    // Verify project data
    expect(result.data.project.id).toBe('project1');
    expect(result.data.project.name).toBe('Mobile App');

    // Verify issues are included
    expect(result.data.issues.length).toBeGreaterThan(0);
    expect(result.data.issues[0].id).toBeDefined();
    expect(result.data.issues[0].title).toBeDefined();
    expect(result.data.issues[0].identifier).toBeDefined();
    expect(result.data.issues[0].status).toBeDefined();

    // Verify stats
    expect(result.data.stats.totalIssues).toBe(result.data.issues.length);
    expect(result.data.stats.completed).toBeGreaterThanOrEqual(0);
    expect(result.data.stats.percentComplete).toBeGreaterThanOrEqual(0);
    expect(result.data.stats.percentComplete).toBeLessThanOrEqual(100);
  });

  it('should return milestone details with in-progress status', async () => {
    // Call the handler with a milestone that has in-progress status
    const args: ResourceArgs = { uri: 'linear-milestone:///milestone2' };
    const result = (await linearMilestoneResourceHandler(
      args
    )) as ResourceResponse<MilestoneResponse>;

    // Verify status and stats for in-progress milestone
    expect(result.data.milestone.status).toBe('inProgress');
    expect(result.data.stats.inProgress).toBeGreaterThan(0);
    expect(result.data.stats.percentComplete).toBeLessThan(100);
  });

  it('should return milestone details with planned status', async () => {
    // Call the handler with a milestone that has planned status
    const args: ResourceArgs = { uri: 'linear-milestone:///milestone3' };
    const result = (await linearMilestoneResourceHandler(
      args
    )) as ResourceResponse<MilestoneResponse>;

    // Verify status and stats for planned milestone
    expect(result.data.milestone.status).toBe('planned');
    expect(result.data.stats.notStarted).toBeGreaterThan(0);
  });

  it('should handle invalid milestone URI format', async () => {
    // Call the handler with an invalid URI format
    const args: ResourceArgs = { uri: 'linear-milestone://invalid-format' };
    const result = await linearMilestoneResourceHandler(args);

    // Verify result is an error
    expect(result.isError).toBe(true);
    expect(result.errorMessage).toContain('Invalid milestone URI');
  });

  it('should handle non-existent milestone ID', async () => {
    // Call the handler with a non-existent milestone ID
    const args: ResourceArgs = { uri: 'linear-milestone:///nonexistent' };
    const result = await linearMilestoneResourceHandler(args);

    // Verify result is an error
    expect(result.isError).toBe(true);
    expect(result.errorMessage).toContain('Milestone with ID nonexistent not found');
  });
});
