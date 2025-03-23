# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024-03-24

### Added

- Initial release of the Linear Model Context Protocol (MCP) server
- Integration with Linear API via `@linear/sdk`
- MCP tools for Linear issue management:
  - User-related tools: get viewer info, retrieve user issues
  - Team-related tools: get teams, get team details, retrieve team issues
  - Issue-related tools: search, create, update issues
  - Comment functionality: add comments to issues
  - Project management: get projects, project details, project issues
  - Issue relationships: link issues, get issue relations
  - Label management: get, create, update labels
  - Attachment handling: add and retrieve attachments
- Environment configuration for Linear API key
- Documentation in README.md and ARCHITECTURE.md
- TypeScript configuration and linting setup
- Testing environment with Jest
- CI/CD workflow setup
- Automatic installation through Smithery
- Docker support

### Notes

- This is the first public release of the MCP server for Linear
- Compatible with Node.js >=16.0.0
- Uses Model Context Protocol SDK v1.7.0
