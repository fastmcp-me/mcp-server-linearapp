/**
 * Linear Team Resources Module
 *
 * Defines resource templates and handlers for Linear team resources.
 *
 * @module resources/linear-team
 */
import { McpResourceTemplate } from '../types.js';
import { registerResource, ResourceHandler, ResourceArgs, ResourceResponse } from '../registry.js';
import { linearClient } from '../linear.js';

/**
 * Linear Team resource template
 */
const linearTeamResourceTemplate: McpResourceTemplate = {
  uriTemplate: 'linear-team:///{teamId}',
  name: 'linear-team',
  description: 'Linear team details',
  mimeType: 'application/json',
};

/**
 * Linear Team Issues resource template
 */
const linearTeamIssuesResourceTemplate: McpResourceTemplate = {
  uriTemplate: 'linear-team:///{teamId}/issues',
  name: 'linear-team-issues',
  description: 'Linear team issues',
  mimeType: 'application/json',
};

// Define types for the responses
export interface LinearTeamDetailResponse {
  id: string;
  name: string;
  key: string;
  description: string;
  color: string;
  icon?: string;
  members: Array<{
    id: string;
    name: string;
    displayName: string;
    email: string;
  }>;
  states: Array<{
    id: string;
    name: string;
    color: string;
    type: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface LinearTeamIssuesResponse {
  team: {
    id: string;
    name: string;
    key: string;
  };
  issues: Array<{
    id: string;
    title: string;
    identifier: string;
    description?: string;
    status: string;
    priority: number;
    assignee?: {
      id: string;
      name: string;
      displayName: string;
    };
    url: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  stats: {
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    byAssignee: Record<string, number>;
  };
}

/**
 * Handler for Linear team resources
 */
export const linearTeamResourceHandler: ResourceHandler = async (
  args: ResourceArgs
): Promise<ResourceResponse<LinearTeamDetailResponse | null>> => {
  try {
    // Extract the teamId from the URI
    const teamId = args.teamId as string;

    if (!teamId) {
      return {
        isError: true,
        errorMessage: 'Invalid team ID',
        data: null,
      };
    }

    // Fetch the team from Linear
    const team = await linearClient.team(teamId);
    if (!team) {
      return {
        isError: true,
        errorMessage: `Team with ID ${teamId} not found`,
        data: null,
      };
    }

    // Fetch the team's members
    const membersConnection = await team.members();
    const members = membersConnection?.nodes || [];

    // Fetch the team's workflow states
    const statesConnection = await team.states();
    const states = statesConnection?.nodes || [];

    // Format the response
    return {
      data: {
        id: team.id,
        name: team.name,
        key: team.key,
        description: team.description,
        color: team.color,
        icon: team.icon,
        members: await Promise.all(
          members.map(async member => ({
            id: member.id,
            name: member.name,
            displayName: member.displayName,
            email: member.email,
          }))
        ),
        states: await Promise.all(
          states.map(async state => ({
            id: state.id,
            name: state.name,
            color: state.color,
            type: state.type,
          }))
        ),
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
      } as LinearTeamDetailResponse,
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
 * Handler for Linear team issues resources
 */
export const linearTeamIssuesResourceHandler: ResourceHandler = async (
  args: ResourceArgs
): Promise<ResourceResponse<LinearTeamIssuesResponse | null>> => {
  try {
    // Extract the teamId from the URI
    const teamId = args.teamId as string;

    if (!teamId) {
      return {
        isError: true,
        errorMessage: 'Invalid team ID',
        data: null,
      };
    }

    // Fetch the team from Linear
    const team = await linearClient.team(teamId);
    if (!team) {
      return {
        isError: true,
        errorMessage: `Team with ID ${teamId} not found`,
        data: null,
      };
    }

    // Fetch the team's issues
    const issuesConnection = await team.issues({ first: 50 });
    const issues = issuesConnection?.nodes || [];

    // Initialize statistics
    const stats = {
      total: issues.length,
      byStatus: {} as Record<string, number>,
      byPriority: {} as Record<string, number>,
      byAssignee: {} as Record<string, number>,
    };

    // Prepare issues with related data
    const processedIssues = await Promise.all(
      issues.map(async issue => {
        const state = await issue.state;
        const assignee = await issue.assignee;

        // Update statistics
        if (state) {
          const statusName = await state.name;
          stats.byStatus[statusName] = (stats.byStatus[statusName] || 0) + 1;
        }

        const priorityLabel = ['Urgent', 'High', 'Medium', 'Low', 'No priority'][issue.priority];
        stats.byPriority[priorityLabel] = (stats.byPriority[priorityLabel] || 0) + 1;

        if (assignee) {
          const assigneeName = await assignee.displayName;
          stats.byAssignee[assigneeName] = (stats.byAssignee[assigneeName] || 0) + 1;
        } else {
          stats.byAssignee['Unassigned'] = (stats.byAssignee['Unassigned'] || 0) + 1;
        }

        return {
          id: issue.id,
          title: issue.title,
          identifier: issue.identifier,
          description: issue.description,
          status: state ? await state.name : 'Unknown',
          priority: issue.priority,
          assignee: assignee
            ? {
                id: await assignee.id,
                name: await assignee.name,
                displayName: await assignee.displayName,
              }
            : undefined,
          url: issue.url,
          createdAt: issue.createdAt,
          updatedAt: issue.updatedAt,
        };
      })
    );

    // Format the response
    return {
      data: {
        team: {
          id: team.id,
          name: team.name,
          key: team.key,
        },
        issues: processedIssues,
        stats,
      } as LinearTeamIssuesResponse,
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
registerResource(linearTeamResourceTemplate, linearTeamResourceHandler);
registerResource(linearTeamIssuesResourceTemplate, linearTeamIssuesResourceHandler);
