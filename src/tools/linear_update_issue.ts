import { registerTool, ToolHandler } from '../registry.js';
import { linearClient } from '../linear.js';

// Define the tool handler
export const linearUpdateIssueHandler: ToolHandler = async args => {
  const params = args as {
    issueId: string;
    title?: string;
    description?: string;
    stateId?: string;
    teamId?: string;
    assigneeId?: string;
    priority?: number;
    dueDate?: string;
  };

  try {
    // Validate required parameters
    if (!params.issueId) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Issue ID is required',
          },
        ],
        isError: true,
      };
    }

    // Check if issue exists
    const issue = await linearClient.issue(params.issueId);
    if (!issue) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: Issue with ID ${params.issueId} not found`,
          },
        ],
        isError: true,
      };
    }

    // Build update input with proper typing
    const updateInput: {
      title?: string;
      description?: string;
      stateId?: string;
      teamId?: string;
      assigneeId?: string;
      priority?: number;
      dueDate?: string;
    } = {};

    // Add optional parameters if provided
    if (params.title) updateInput.title = params.title;
    if (params.description) updateInput.description = params.description;
    if (params.stateId) updateInput.stateId = params.stateId;
    if (params.teamId) updateInput.teamId = params.teamId;
    if (params.assigneeId) updateInput.assigneeId = params.assigneeId;
    if (params.priority !== undefined) updateInput.priority = params.priority;
    if (params.dueDate) updateInput.dueDate = params.dueDate;

    // Update the issue
    const updatePayload = await linearClient.updateIssue(params.issueId, updateInput);

    if (!updatePayload.success) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Failed to update issue',
          },
        ],
        isError: true,
      };
    }

    // Get updated issue data with proper awaits
    const updatedIssue = updatePayload.issue;
    if (!updatedIssue) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Failed to retrieve updated issue data',
          },
        ],
        isError: true,
      };
    }

    // Process all issue data
    const issue_data = await updatedIssue;

    // Process related objects if they exist
    const state = await updatedIssue.then(issue => issue.state);
    const team = await updatedIssue.then(issue => issue.team);
    const assignee = await updatedIssue.then(issue => issue.assignee);

    const responseData = {
      id: issue_data.id,
      title: issue_data.title,
      description: issue_data.description,
      state: state ? await state.name : null,
      team: team ? await team.name : null,
      assignee: assignee ? await assignee.name : null,
      priority: issue_data.priority,
      url: issue_data.url,
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(responseData),
        },
      ],
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : 'Unknown error occurred';

    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
};

// Register the tool
export const linearUpdateIssueTool = registerTool(
  {
    name: 'linear_update_issue',
    description: 'Update an existing Linear issue',
    inputSchema: {
      type: 'object',
      properties: {
        issueId: {
          type: 'string',
          description: 'Issue ID to update',
        },
        title: {
          type: 'string',
          description: 'New issue title',
        },
        description: {
          type: 'string',
          description: 'New issue description (markdown supported)',
        },
        stateId: {
          type: 'string',
          description: 'New state ID',
        },
        teamId: {
          type: 'string',
          description: 'New team ID',
        },
        assigneeId: {
          type: 'string',
          description: 'User ID to assign the issue to',
        },
        priority: {
          type: 'number',
          description: 'New priority level (0-4), where 0=no priority, 1=urgent, 4=low',
        },
        dueDate: {
          type: 'string',
          description: 'New due date',
        },
      },
      required: ['issueId'],
    },
  },
  linearUpdateIssueHandler
);
