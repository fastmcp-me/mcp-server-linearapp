import { registerTool, ToolHandler } from '../registry.js';
import { linearClient } from '../linear.js';

// Define the tool handler
export const linearGetViewerHandler: ToolHandler = async () => {
  try {
    // Get the authenticated user (viewer)
    const viewer = await linearClient.viewer;
    if (!viewer) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Failed to get authenticated user',
          },
        ],
        isError: true,
      };
    }

    // Extract user data
    const userData = {
      id: await viewer.id,
      name: await viewer.name,
      displayName: await viewer.displayName,
      email: await viewer.email,
      active: await viewer.active,
      admin: await viewer.admin,
      avatarUrl: await viewer.avatarUrl,
      url: await viewer.url,
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(userData),
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
export const linearGetViewerTool = registerTool(
  {
    name: 'linear_get_viewer',
    description: 'Get information about the authenticated user',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  linearGetViewerHandler
);
