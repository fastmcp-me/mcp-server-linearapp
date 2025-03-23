/**
 * Linear Issue Resources Module
 *
 * Defines resource templates and handlers for Linear issues.
 *
 * @module resources/linear-issue
 */
import { McpResourceTemplate, McpResourceContent } from '../types.js';
import { registerResource, ResourceHandler, ResourceArgs, ResourceResponse } from '../registry.js';
import { linearClient } from '../linear.js';

/**
 * Linear Issue resource template
 *
 * Template for addressing individual Linear issues by ID.
 */
const linearIssueResourceTemplate: McpResourceTemplate = {
  uriTemplate: 'linear-issue:///{issueId}',
  name: 'linear-issue',
  description: 'Linear issue',
  mimeType: 'application/json',
};

// Define types for the responses
export interface LinearIssueResponse {
  id: string;
  title: string;
  description?: string;
  comments: Array<{
    id: string;
    body: string;
    createdAt: Date;
    user: {
      id: string;
      name: string;
      displayName: string;
    } | null;
  }>;
  identifier: string;
  priority: number;
  url: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Handler for Linear issue resources
 *
 * Fetches a specific Linear issue by ID and returns its details
 * including comments and other metadata.
 *
 * @param {ResourceArgs} args - The resource arguments containing the issueId
 * @returns {Promise<ResourceResponse>} The issue data or error information
 */
export const linearIssueResourceHandler: ResourceHandler = async (
  args: ResourceArgs
): Promise<ResourceResponse<McpResourceContent | null>> => {
  try {
    // Extract the issueId from the URI
    const issueId = args.issueId as string;

    if (!issueId) {
      return {
        isError: true,
        errorMessage: 'Invalid issue ID',
        data: null,
      };
    }

    // Fetch the issue from Linear
    const issue = await linearClient.issue(issueId);
    if (!issue) {
      return {
        isError: true,
        errorMessage: `Issue with ID ${issueId} not found`,
        data: null,
      };
    }

    // Also fetch the comments
    const commentsConnection = await issue.comments();
    const comments = commentsConnection?.nodes || [];

    // Enrich the response with comments
    const commentsWithUsers = await Promise.all(
      comments.map(async comment => {
        try {
          const user = await comment.user;
          return {
            id: comment.id,
            body: comment.body,
            createdAt: comment.createdAt,
            user: user
              ? {
                  id: user.id,
                  name: user.name,
                  displayName: user.displayName,
                }
              : null,
          };
        } catch (error) {
          console.error('Error fetching comment user:', error);
          return {
            id: comment.id,
            body: comment.body,
            createdAt: comment.createdAt,
            user: null,
          };
        }
      })
    );

    const issueData = {
      id: issue.id,
      title: issue.title,
      description: issue.description,
      comments: commentsWithUsers,
      identifier: issue.identifier,
      priority: issue.priority,
      url: issue.url,
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
    } as LinearIssueResponse;

    return {
      data: {
        uri: `linear-issue:///${issueId}`,
        mimeType: 'application/json',
        text: JSON.stringify(issueData),
      },
      isError: false,
    };
  } catch (error) {
    return {
      isError: true,
      errorMessage: typeof error === 'string' ? error : String(error),
      data: null,
    };
  }
};

// Register the Linear resource templates and handlers
registerResource(linearIssueResourceTemplate, linearIssueResourceHandler);
