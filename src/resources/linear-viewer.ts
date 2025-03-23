/**
 * Linear Viewer Resources Module
 *
 * Defines resource templates and handlers for Linear viewer resources.
 * Includes basic viewer information as well as teams, projects, and assigned issues.
 *
 * @module resources/linear-viewer
 */
import { McpResource, McpResourceContent } from '../types.js';
import { registerResource, ResourceHandler, ResourceResponse } from '../registry.js';
import { linearClient } from '../linear.js';
import { Project } from '@linear/sdk';

/**
 * Linear viewer resource
 *
 * Resource for accessing information about the current Linear user.
 */
const linearViewerResource: McpResource = {
  uri: 'linear-viewer:',
  name: 'linear-viewer',
  description: 'Current Linear user',
  mimeType: 'application/json',
};

/**
 * Linear Viewer Teams Resource for getting all teams the current user belongs to
 */
const linearViewerTeamsResource: McpResource = {
  uri: 'linear-viewer:///teams',
  name: 'linear-viewer-teams',
  description: "Current Linear user's teams",
  mimeType: 'application/json',
};

/**
 * Linear Viewer Projects Resource for getting all projects the current user is involved with
 */
const linearViewerProjectsResource: McpResource = {
  uri: 'linear-viewer:///projects',
  name: 'linear-viewer-projects',
  description: "Current Linear user's projects",
  mimeType: 'application/json',
};

/**
 * Linear Viewer Assigned Resource for getting all issues assigned to the current user
 */
const linearViewerAssignedResource: McpResource = {
  uri: 'linear-viewer:///assigned',
  name: 'linear-viewer-assigned',
  description: 'Issues assigned to the current Linear user',
  mimeType: 'application/json',
};

// Define types for the responses
export interface LinearViewerResponse {
  id: string;
  name: string;
  displayName: string;
  email: string;
  active: boolean;
}

/**
 * Handler for Linear viewer resource
 */
export const linearViewerResourceHandler: ResourceHandler = async (): Promise<
  ResourceResponse<McpResourceContent | null>
> => {
  try {
    // Fetch the current viewer from Linear
    const viewer = await linearClient.viewer;
    if (!viewer) {
      return {
        isError: true,
        errorMessage: 'Failed to fetch viewer',
        data: null,
      };
    }

    const viewerData = {
      id: viewer.id,
      name: viewer.name,
      displayName: viewer.displayName,
      email: viewer.email,
      active: viewer.active,
    } as LinearViewerResponse;

    return {
      data: {
        uri: 'linear-viewer:',
        mimeType: 'application/json',
        text: JSON.stringify(viewerData),
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

/**
 * Handler for Linear Viewer Teams Resource
 */
export const linearViewerTeamsResourceHandler: ResourceHandler = async (): Promise<
  ResourceResponse<McpResourceContent | null>
> => {
  try {
    // Fetch the current viewer
    const viewer = await linearClient.viewer;
    if (!viewer) {
      return {
        isError: true,
        errorMessage: 'Failed to fetch current user',
        data: null,
      };
    }

    // Fetch the user's teams
    const teamsConnection = await viewer.teams();
    const teams = teamsConnection?.nodes || [];

    // Format the response
    const teamsData = teams.map(team => ({
      id: team.id,
      name: team.name,
      key: team.key,
      description: team.description,
      icon: team.icon,
      color: team.color,
    }));

    return {
      data: {
        uri: 'linear-viewer:///teams',
        mimeType: 'application/json',
        text: JSON.stringify({
          teams: teamsData,
          user: {
            id: viewer.id,
            name: viewer.name,
            displayName: viewer.displayName,
          },
        }),
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

/**
 * Handler for Linear Viewer Projects Resource
 */
export const linearViewerProjectsResourceHandler: ResourceHandler = async (): Promise<
  ResourceResponse<McpResourceContent | null>
> => {
  try {
    // Fetch the current viewer
    const viewer = await linearClient.viewer;
    if (!viewer) {
      return {
        isError: true,
        errorMessage: 'Failed to fetch current user',
        data: null,
      };
    }

    // Fetch the user's projects - need to use a different approach since assignedProjects is not directly available
    // We'll get all teams first, then get projects from each team
    const teamsConnection = await viewer.teams();
    const teams = teamsConnection?.nodes || [];

    // Get projects from teams
    const projectsMap = new Map<string, Project>();

    // Process teams to get projects
    for (const team of teams.slice(0, 5)) {
      // Limit to 5 teams to prevent timeouts
      const projectsConnection = await team.projects({ first: 20 });

      if (projectsConnection?.nodes) {
        for (const project of projectsConnection.nodes) {
          // Only add project if we haven't seen it yet and if the viewer is a member
          if (!projectsMap.has(project.id)) {
            const members = await project.members();
            const isMember = members?.nodes?.some(member => member.id === viewer.id);

            if (isMember) {
              projectsMap.set(project.id, project);
            }
          }
        }
      }
    }

    const projects = Array.from(projectsMap.values());

    // Format the response
    const projectsData = await Promise.all(
      projects.map(async project => {
        // Using any to bypass type checking for now
        let lead = null;
        let status = null;

        try {
          lead = await project.lead;
          status = await project.status;
        } catch (error) {
          console.error('Error fetching project details:', error);
        }

        return {
          id: project.id,
          name: project.name,
          description: project.description,
          state: status ? status.name : 'Unknown',
          startDate: project.startDate,
          targetDate: project.targetDate,
          lead: lead
            ? {
                id: lead.id,
                name: lead.name,
                displayName: lead.displayName,
              }
            : null,
        };
      })
    );

    return {
      data: {
        uri: 'linear-viewer:///projects',
        mimeType: 'application/json',
        text: JSON.stringify({
          projects: projectsData,
          user: {
            id: viewer.id,
            name: viewer.name,
            displayName: viewer.displayName,
          },
        }),
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

/**
 * Handler for Linear Viewer Assigned Resource
 */
export const linearViewerAssignedResourceHandler: ResourceHandler = async (): Promise<
  ResourceResponse<McpResourceContent | null>
> => {
  try {
    // Fetch the current viewer
    const viewer = await linearClient.viewer;
    if (!viewer) {
      return {
        isError: true,
        errorMessage: 'Failed to fetch current user',
        data: null,
      };
    }

    // Fetch the assigned issues
    const issuesConnection = await viewer.assignedIssues({ first: 50 });
    const issues = issuesConnection?.nodes || [];

    // Format the response
    const issuesData = await Promise.all(
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
    );

    return {
      data: {
        uri: 'linear-viewer:///assigned',
        mimeType: 'application/json',
        text: JSON.stringify({
          assignedIssues: issuesData,
          user: {
            id: viewer.id,
            name: viewer.name,
            displayName: viewer.displayName,
          },
        }),
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

// Register all resources
registerResource(linearViewerResource, linearViewerResourceHandler);
registerResource(linearViewerTeamsResource, linearViewerTeamsResourceHandler);
registerResource(linearViewerProjectsResource, linearViewerProjectsResourceHandler);
registerResource(linearViewerAssignedResource, linearViewerAssignedResourceHandler);
