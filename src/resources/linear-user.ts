/**
 * Linear User Resources Module
 *
 * Defines resource templates and handlers for Linear user resources.
 *
 * @module resources/linear-user
 */
import { McpResourceTemplate, McpResourceContent } from '../types.js';
import { registerResource, ResourceHandler, ResourceArgs, ResourceResponse } from '../registry.js';
import { linearClient } from '../linear.js';

/**
 * Linear User Assigned resource template
 */
const linearUserAssignedResourceTemplate: McpResourceTemplate = {
  uriTemplate: 'linear-user:///{userId}/assigned',
  name: 'linear-user-assigned',
  description: 'Linear user assigned issues',
  mimeType: 'application/json',
};

/**
 * Linear User Issues resource template
 *
 * Template for addressing all issues assigned to a specific user.
 */
const linearUserIssuesResourceTemplate: McpResourceTemplate = {
  uriTemplate: 'linear-user:///{userId}/issues',
  name: 'linear-user-issues',
  description: 'Linear user issues',
  mimeType: 'application/json',
};

// Define types for the responses
export interface LinearUserAssignedResponse {
  user: {
    id: string;
    name: string;
    displayName: string;
  };
  assignedIssues: Array<{
    id: string;
    title: string;
    identifier: string;
    description?: string;
    status: string;
    priority: number;
    project?: {
      id: string;
      name: string;
    };
    team?: {
      id: string;
      name: string;
      key: string;
    };
    url: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
}

export interface LinearUserResponse {
  user: {
    id: string;
    name: string;
    displayName: string;
  };
  assignedIssues: Array<{
    id: string;
    title: string;
    identifier: string;
    description?: string;
    status: string;
    priority: number;
    url: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
}

/**
 * Handler for Linear user assigned issues resources
 */
export const linearUserAssignedResourceHandler: ResourceHandler = async (
  args: ResourceArgs
): Promise<ResourceResponse<LinearUserAssignedResponse | null>> => {
  try {
    // Extract the userId from the URI
    const userId = args.userId as string;

    if (!userId) {
      return {
        isError: true,
        errorMessage: 'Invalid user ID',
        data: null,
      };
    }

    // Fetch the user from Linear
    const user = await linearClient.user(userId);
    if (!user) {
      return {
        isError: true,
        errorMessage: `User with ID ${userId} not found`,
        data: null,
      };
    }

    // Fetch the user's assigned issues
    const assignedIssuesConnection = await user.assignedIssues({ first: 50 });
    const issues = assignedIssuesConnection?.nodes || [];

    // Format the response
    return {
      data: {
        user: {
          id: user.id,
          name: user.name,
          displayName: user.displayName,
        },
        assignedIssues: await Promise.all(
          issues.map(async issue => {
            const state = await issue.state;
            const project = await issue.project;
            const team = await issue.team;

            return {
              id: issue.id,
              title: issue.title,
              identifier: issue.identifier,
              description: issue.description,
              status: state ? await state.name : 'Unknown',
              priority: issue.priority,
              project: project
                ? {
                    id: project.id,
                    name: project.name,
                  }
                : undefined,
              team: team
                ? {
                    id: team.id,
                    name: team.name,
                    key: team.key,
                  }
                : undefined,
              url: issue.url,
              createdAt: issue.createdAt,
              updatedAt: issue.updatedAt,
            };
          })
        ),
      } as LinearUserAssignedResponse,
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

/**
 * Handler for Linear user issues resources
 */
export const linearUserIssuesResourceHandler: ResourceHandler = async (
  args: ResourceArgs
): Promise<ResourceResponse<McpResourceContent | null>> => {
  try {
    // Extract the userId from the URI
    const userId = args.userId as string;

    if (!userId) {
      return {
        isError: true,
        errorMessage: 'Invalid user ID',
        data: null,
      };
    }

    // Fetch the user from Linear
    const user = await linearClient.user(userId);
    if (!user) {
      return {
        isError: true,
        errorMessage: `User with ID ${userId} not found`,
        data: null,
      };
    }

    // Fetch the user's assigned issues
    const assignedIssuesConnection = await user.assignedIssues({ first: 50 });
    const issues = assignedIssuesConnection?.nodes || [];

    const userIssuesData = {
      user: {
        id: user.id,
        name: user.name,
        displayName: user.displayName,
      },
      assignedIssues: await Promise.all(
        issues.map(async issue => {
          const state = await issue.state;
          return {
            id: issue.id,
            title: issue.title,
            identifier: issue.identifier,
            description: issue.description,
            status: state ? await state.name : 'Unknown',
            priority: issue.priority,
            url: issue.url,
            createdAt: issue.createdAt,
            updatedAt: issue.updatedAt,
          };
        })
      ),
    } as LinearUserResponse;

    return {
      data: {
        uri: `linear-user:///${userId}/issues`,
        mimeType: 'application/json',
        text: JSON.stringify(userIssuesData),
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

// Register the resources
registerResource(linearUserAssignedResourceTemplate, linearUserAssignedResourceHandler);
registerResource(linearUserIssuesResourceTemplate, linearUserIssuesResourceHandler);
