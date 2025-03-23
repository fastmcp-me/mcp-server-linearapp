# Linear Model Context Protocol Server Architecture

## Overview

The Linear MCP Server is a TypeScript-based implementation of the Model Context Protocol (MCP) for integrating with Linear's issue tracking system. The server provides a standardized interface for AI assistants to access and manipulate Linear data, including teams, issues, projects, users, and more.

## Core Components

### 1. Server

- `src/index.ts`: Entry point that initializes the MCP server and sets up transport
- `src/config.ts`: Configuration management, environment variables, and URL construction
- `src/linear.js`: Linear API client abstraction providing access to the Linear GraphQL API

### 2. MCP Implementation

- `src/registry.ts`: Core registry for tools, prompts, and resources. Provides functions for registering, retrieving, and handling MCP resources
- Type definitions for MCP resources, including `ResourceResponse`, `ToolResponse`, and `PromptResponse`

### 3. Resources

Resources are data models that can be accessed by AI assistants. Each resource follows a consistent pattern:

```
linear-[resource-type].ts
```

Resource files:

- `src/resources/linear-viewer.ts`: Current user/viewer data and related information
- `src/resources/linear-team.ts`: Team data, team members, and team issues
- `src/resources/linear-user.ts`: User information and assigned issues
- `src/resources/linear-issue.ts`: Issue details and management
- `src/resources/linear-project.ts`: Project information and related issues
- `src/resources/linear-label.ts`: Label management
- `src/resources/linear-attachment.ts`: Issue attachments
- `src/resources/linear-milestone.ts`: Milestone tracking
- `src/resources/linear-organization.ts`: Organization-level information

Each resource file exports:

- Type definitions for resource requests and responses
- Resource handler functions that retrieve data from Linear's API
- Error handling and data transformation logic

### 4. Tools

Tools are executable functions that allow AI assistants to perform operations on Linear. Tool files follow a naming pattern:

```
linear_[action]_[resource].ts
```

Examples:

- `src/tools/linear_get_teams.ts`: Retrieve teams from Linear
- `src/tools/linear_create_issue.ts`: Create a new issue
- `src/tools/linear_update_issue.ts`: Update an existing issue
- `src/tools/linear_add_comment.ts`: Add comments to issues
- `src/tools/linear_get_attachments.ts`: Get issue attachments
- `src/tools/linear_link_issues.ts`: Create relationships between issues

Each tool file contains:

- Parameter validation
- Business logic for interacting with Linear
- Response formatting
- Error handling

## Data Flow

1. The MCP Server receives requests from AI assistants via the MCP protocol
2. Requests are routed to the appropriate resource handler or tool function
3. The handler/tool fetches data from or sends data to Linear's API
4. Responses are formatted according to MCP specifications and returned to the assistant

## Testing Architecture

The project uses Jest for testing, with a comprehensive suite of tests for:

- Resource handlers
- Tool functions
- Error handling
- Edge cases

Mock implementations are used to simulate Linear API responses, avoiding external requests during testing.

## Error Handling

The architecture includes consistent error handling:

- API errors from Linear are caught and transformed into appropriate MCP responses
- Input validation provides meaningful error messages
- Edge cases (missing data, malformed requests) are handled gracefully

## Extension Points

The system is designed to be extensible:

- New resources can be added by creating new resource handler files
- Additional tools can be implemented by following the existing pattern
- The registry system allows for dynamic registration of new capabilities
