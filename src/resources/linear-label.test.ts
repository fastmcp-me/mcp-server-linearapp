import { linearLabelResourceHandler } from './linear-label.js';
import { ResourceArgs, ResourceResponse } from '../registry.js';

// Define the expected response type
interface LabelResponse {
  label: {
    id: string;
    name: string;
    color: string;
    description: string;
    teamId: string;
    teamName: string;
    teamKey: string;
    createdAt: Date;
    updatedAt: Date;
    archived: boolean;
    archivedAt: Date | null;
    parentId: string | null;
    parentName: string | null;
  };
  team: {
    id: string;
    name: string;
    key: string;
  };
  issues: {
    id: string;
    title: string;
    identifier: string;
  }[];
}

describe('linear-label resource', () => {
  it('should return label details for a valid label ID', async () => {
    // Call the handler with a valid label URI
    const args: ResourceArgs = { uri: 'linear-label:///label1' };
    const result = (await linearLabelResourceHandler(args)) as ResourceResponse<LabelResponse>;

    // Verify result format
    expect(result.isError).toBeUndefined();
    expect(result.data).toBeDefined();

    // Verify the response structure
    expect(result.data.label).toBeDefined();
    expect(result.data.team).toBeDefined();
    expect(result.data.issues).toBeDefined();

    // Verify the label data
    expect(result.data.label.id).toBe('label1');
    expect(result.data.label.name).toBe('Bug');
    expect(result.data.label.color).toBe('#FF0000');

    // Verify issues are included
    expect(result.data.issues.length).toBeGreaterThan(0);
    expect(result.data.issues[0].id).toBeDefined();
    expect(result.data.issues[0].title).toBeDefined();
    expect(result.data.issues[0].identifier).toBeDefined();
  });

  it('should return nested label details with parent information', async () => {
    // Call the handler with a label that has a parent
    const args: ResourceArgs = { uri: 'linear-label:///label5' };
    const result = (await linearLabelResourceHandler(args)) as ResourceResponse<LabelResponse>;

    // Verify parent information is included
    expect(result.data.label.parentId).toBe('label3');
    expect(result.data.label.parentName).toBe('UI');
  });

  it('should handle invalid label URI format', async () => {
    // Call the handler with an invalid URI format
    const args: ResourceArgs = { uri: 'linear-label://invalid-format' };
    const result = await linearLabelResourceHandler(args);

    // Verify result is an error
    expect(result.isError).toBe(true);
    expect(result.errorMessage).toContain('Invalid label URI');
  });

  it('should handle non-existent label ID', async () => {
    // Call the handler with a non-existent label ID
    const args: ResourceArgs = { uri: 'linear-label:///nonexistent' };
    const result = await linearLabelResourceHandler(args);

    // Verify result is an error
    expect(result.isError).toBe(true);
    expect(result.errorMessage).toContain('Label with ID nonexistent not found');
  });
});
