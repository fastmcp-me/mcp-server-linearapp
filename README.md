[![Add to Cursor](https://fastmcp.me/badges/cursor_dark.svg)](https://fastmcp.me/MCP/Details/653/linear)
[![Add to VS Code](https://fastmcp.me/badges/vscode_dark.svg)](https://fastmcp.me/MCP/Details/653/linear)
[![Add to Claude](https://fastmcp.me/badges/claude_dark.svg)](https://fastmcp.me/MCP/Details/653/linear)
[![Add to ChatGPT](https://fastmcp.me/badges/chatgpt_dark.svg)](https://fastmcp.me/MCP/Details/653/linear)
[![Add to Codex](https://fastmcp.me/badges/codex_dark.svg)](https://fastmcp.me/MCP/Details/653/linear)
[![Add to Gemini](https://fastmcp.me/badges/gemini_dark.svg)](https://fastmcp.me/MCP/Details/653/linear)

# Linear MCP Server

[![npm version](https://img.shields.io/npm/v/mcp-server-linearapp.svg)](https://www.npmjs.com/package/mcp-server-linearapp) [![smithery badge](https://smithery.ai/badge/mcp-server-linearapp)](https://smithery.ai/server/mcp-server-linearapp)

A [Model Context Protocol](https://github.com/modelcontextprotocol) server for the [Linear API](https://developers.linear.app/docs/graphql/working-with-the-graphql-api).

This server provides integration with Linear's issue tracking system through MCP, allowing LLMs to interact with Linear issues.

## Installation

### Automatic Installation

To install the Linear MCP server for Claude Desktop automatically via [Smithery](https://smithery.ai/protocol/mcp-server-linearapp):

```bash
npx @smithery/cli install mcp-server-linearapp --client claude
```

### Manual Installation

1. Create or get a Linear personal API key: [https://linear.app/settings/account/security](https://linear.app/settings/account/security)

2. Add server config to Claude Desktop:
   - MacOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "linear": {
      "command": "npx",
      "args": ["-y", "mcp-server-linearapp"],
      "env": {
        "LINEAR_API_KEY": "your_linear_api_key_here"
      }
    }
  }
}
```

## Components

### Tools

#### User-Related Tools

1. **`linear_get_viewer`**: Get information about the authenticated user

   - No inputs required
   - Returns user profile information including ID, name, email, and active status

2. **`linear_get_user_issues`**: Get issues assigned to a user

   - Optional inputs:
     - `userId` (string): User ID (omit for authenticated user)
     - `includeArchived` (boolean): Include archived issues
     - `limit` (number, default: 50): Max results

3. **`linear_get_user_teams`**: Get teams associated with a user

   - Optional inputs:
     - `userId` (string): User ID to get teams for (omit for authenticated user)
     - `includeArchived` (boolean): Include archived teams
     - `limit` (number, default: 50): Maximum number of teams to return
   - Returns list of teams the user is a member of

4. **`linear_get_user_projects`**: Get projects associated with a user
   - Optional inputs:
     - `userId` (string): User ID to get projects for (omit for authenticated user)
     - `includeArchived` (boolean): Include archived projects
     - `limit` (number, default: 50): Maximum number of projects to return
     - `status` (string): Filter by project status (e.g., 'completed', 'in progress')
   - Returns list of projects where the user is a lead or member

#### Team-Related Tools

5. **`linear_get_teams`**: Get teams in the organization

   - Optional inputs:
     - `includeArchived` (boolean): Include archived teams
     - `limit` (number, default: 50): Maximum number of teams to return

6. **`linear_get_team`**: Get details about a specific team

   - Required inputs:
     - `teamId` (string): Team ID to get details for
   - Returns team information including name, key, members, and settings

7. **`linear_get_team_issues`**: Get issues for a specific team
   - Required inputs:
     - `teamId` (string): Team ID to get issues for
   - Optional inputs:
     - `includeArchived` (boolean): Include archived issues
     - `limit` (number, default: 50): Maximum number of issues to return
     - `status` (string): Filter by issue status
     - `priority` (number): Filter by priority level
     - `assigneeId` (string): Filter by assignee

#### Project-Related Tools

8. **`linear_get_projects`**: Get projects in the organization

   - Optional inputs:
     - `teamId` (string): Filter projects by team
     - `includeArchived` (boolean): Include archived projects
     - `limit` (number, default: 50): Maximum number of projects to return
     - `status` (string): Filter by project status

9. **`linear_get_project`**: Get details about a specific project

   - Required inputs:
     - `projectId` (string): Project ID to get details for
   - Returns detailed project information including progress, status, team, lead, and dates

10. **`linear_get_project_issues`**: Get issues for a specific project
    - Required inputs:
      - `projectId` (string): Project ID to get issues for
    - Optional inputs:
      - `includeArchived` (boolean): Include archived issues
      - `limit` (number, default: 50): Maximum number of issues to return
      - `status` (string): Filter by issue status
      - `priority` (number): Filter by priority level

#### Issue-Related Tools

11. **`linear_create_issue`**: Create a new Linear issue

    - Required inputs:
      - `title` (string): Issue title
      - `teamId` (string): Team ID to create issue in
    - Optional inputs:
      - `description` (string): Issue description (markdown supported)
      - `priority` (number, 0-4): Priority level (1=urgent, 4=low)
      - `status` (string): Initial status name

12. **`linear_update_issue`**: Update existing issues

    - Required inputs:
      - `id` (string): Issue ID to update
    - Optional inputs:
      - `title` (string): New title
      - `description` (string): New description
      - `priority` (number, 0-4): New priority
      - `status` (string): New status name

13. **`linear_search_issues`**: Search issues with flexible filtering

    - Optional inputs:
      - `query` (string): Text to search in title/description
      - `teamId` (string): Filter by team
      - `status` (string): Filter by status
      - `assigneeId` (string): Filter by assignee
      - `labels` (string[]): Filter by labels
      - `priority` (number): Filter by priority
      - `limit` (number, default: 10): Max results

14. **`linear_add_comment`**: Add comments to issues
    - Required inputs:
      - `issueId` (string): Issue ID to comment on
      - `body` (string): Comment text (markdown supported)
    - Optional inputs:
      - `createAsUser` (string): Custom username
      - `displayIconUrl` (string): Custom avatar URL

#### Label Management Tools

15. **`linear_get_labels`**: Get labels in the organization

    - Optional inputs:
      - `teamId` (string): Filter labels by team
      - `includeArchived` (boolean): Include archived labels
      - `limit` (number, default: 50): Maximum number of labels to return

16. **`linear_create_label`**: Create a new label

    - Required inputs:
      - `name` (string): Label name
      - `teamId` (string): Team ID to create label in
    - Optional inputs:
      - `color` (string): Color hex code (e.g., "#FF0000")
      - `description` (string): Label description

17. **`linear_update_label`**: Update an existing label
    - Required inputs:
      - `id` (string): Label ID to update
    - Optional inputs:
      - `name` (string): New label name
      - `color` (string): New color hex code
      - `description` (string): New description

#### Attachment Management Tools

18. **`linear_add_attachment`**: Add an attachment to an issue

    - Required inputs:
      - `issueId` (string): Issue ID to add attachment to
      - `url` (string): URL of attachment
      - `title` (string): Title of attachment
    - Optional inputs:
      - `subtitle` (string): Subtitle for attachment
      - `icon` (string): Icon URL for attachment

19. **`linear_get_attachments`**: Get attachments for an issue
    - Required inputs:
      - `issueId` (string): Issue ID to get attachments for

#### Issue Relationship Tools

20. **`linear_link_issues`**: Create a relationship between issues

    - Required inputs:
      - `issueId` (string): Source issue ID
      - `relatedIssueId` (string): Target issue ID
      - `type` (string): Relationship type (e.g., "blocks", "related", "duplicate")

21. **`linear_get_issue_relations`**: Get relationships for an issue
    - Required inputs:
      - `issueId` (string): Issue ID to get relationships for
    - Optional inputs:
      - `type` (string): Filter by relationship type

#### Milestone Management Tools

22. **`linear_get_milestones`**: Get milestones for a project

    - Optional inputs:
      - `projectId` (string): Filter milestones by project
      - `includeArchived` (boolean): Include archived milestones
      - `limit` (number, default: 50): Maximum number of milestones to return

23. **`linear_create_milestone`**: Create a new milestone

    - Required inputs:
      - `name` (string): Milestone name
      - `projectId` (string): Project ID to create milestone in
      - `targetDate` (string): Target completion date (ISO format)
    - Optional inputs:
      - `description` (string): Milestone description
      - `sortOrder` (number): Position in milestone list

24. **`linear_update_milestone`**: Update an existing milestone
    - Required inputs:
      - `id` (string): Milestone ID to update
    - Optional inputs:
      - `name` (string): New milestone name
      - `targetDate` (string): New target date
      - `description` (string): New description
      - `status` (string): New status (e.g., "planned", "inProgress", "completed")

### Resources

- **`linear-issue:///{issueId}`**: View individual issue details

  - Returns issue information including title, description, comments, and metadata

- **`linear-team:///{teamId}`**: View team details

  - Returns team information including name, key, description, and members

- **`linear-team:///{teamId}/issues`**: View team issues

  - Returns all issues for a specific team with status and priority information

- **`linear-project:///{projectId}`**: View project details

  - Returns project information including name, description, progress, status, lead, teams, and timelines

- **`linear-project:///{projectId}/issues`**: View project issues

  - Returns all issues for a specific project with status and assignment information

- **`linear-project:///{projectId}/milestones`**: View project milestones

  - Returns all milestones for a specific project with progress and status information

- **`linear-user:///{userId}/assigned`**: View user's assigned issues

  - Returns issues assigned to a specific user with project and team context

- **`linear-organization:`**: View organization info

  - Returns organization-level information including name and settings

- **`linear-viewer:`**: View current user context

  - Returns information about the authenticated user

- **`linear-viewer:///teams`**: View teams for the authenticated user

  - Returns all teams the current user is a member of

- **`linear-viewer:///projects`**: View projects for the authenticated user

  - Returns all projects the current user is involved with (as lead or member)

- **`linear-viewer:///assigned`**: View issues assigned to the authenticated user

  - Returns all issues assigned to the current user with project and team context

- **`linear-label:///{labelId}`**: View label details

  - Returns label information including name, color, and associated issues

## Usage examples

Here are example prompts you can use with Claude Desktop to interact with Linear:

### Issue Management

- "Create a new bug report for the authentication system" → use `linear_create_issue` to create a new issue with appropriate details

- "Update the priority of ticket FRONT-123 to urgent" → use `linear_update_issue` to modify the priority of an existing issue

- "Add a comment to the login page bug explaining the root cause" → use `linear_add_comment` to add information to an existing issue

### Finding and Filtering Issues

- "Show me all my high-priority issues" → use `linear_get_user_issues` or `linear-viewer:///assigned` to find issues assigned to you with high priority

- "Find all in-progress frontend tasks" → use `linear_search_issues` to locate frontend-related issues with "in progress" status

- "What issues are currently assigned to Sarah?" → use `linear_get_user_issues` with Sarah's ID to see her assignments

### Team and Project Management

- "What teams am I a member of?" → use `linear_get_user_teams` or `linear-viewer:///teams` to list all teams the authenticated user belongs to

- "Show me the projects I'm leading or contributing to" → use `linear_get_user_projects` or `linear-viewer:///projects` to get all projects associated with the current user

- "What's the current progress on the mobile app project?" → use `linear_get_project` to get detailed information about the project including progress

- "List all the active projects for the Frontend team" → combine `linear_get_team` to find the team ID and `linear_get_projects` with team filter to locate active projects

### Status and Workload Analysis

- "Give me a summary of recent updates on the billing system issues" → use `linear_search_issues` to identify the relevant issues, then `linear-issue:///{issueId}` to fetch the issue details

- "What's the current workload for the mobile team?" → use `linear-team:///{teamId}/issues` or `linear_get_team_issues` to analyze issue distribution across the team

- "Show me my role and responsibilities in the organization" → use `linear_get_viewer` and `linear-viewer:///teams` to analyze team memberships and roles

### Label and Categorization

- "Create a 'security' label for high-priority security issues" → use `linear_create_label` to create a new label with appropriate settings

- "What labels are available in the Frontend team?" → use `linear_get_labels` with the Frontend team ID to see available categorizations

- "Apply the 'needs-documentation' label to all API issues" → use `linear_search_issues` to find API-related issues, then update each with `linear_update_issue`

### Milestone Management

- "Create a milestone for the beta release" → use `linear_create_milestone` to set up a project milestone with a target date

- "What milestones are upcoming in the mobile app project?" → use `linear_get_milestones` with the project ID to view planned delivery points

- "Update the status of the API v2 milestone to completed" → use `linear_update_milestone` to change milestone status

### Issue Relationships

- "Mark issue FRONT-123 as blocking API-456" → use `linear_link_issues` to create a blocking relationship between issues

- "What issues are being blocked by this bug?" → use `linear_get_issue_relations` to find dependencies

- "Show me all issues related to the authentication system" → use `linear_search_issues` with appropriate filters, then explore relationships with `linear_get_issue_relations`

## Development

1. Install dependencies:

```bash
npm install
```

2. Configure Linear API key in `.env`:

```bash
LINEAR_API_KEY=your_api_key_here
```

3. Build the server:

```bash
npm run build
```

For development with auto-rebuild:

```bash
npm run watch
```

## License

This MCP server is licensed under the MIT License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the MIT License. For more details, please see the LICENSE file in the project repository.
