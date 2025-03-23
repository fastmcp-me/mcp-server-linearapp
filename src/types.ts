/**
 * Type definitions for the MCP Linear server
 *
 * This module contains type declarations for MCP resources,
 * resource templates, and resource content used throughout the server.
 * @module types
 */

/**
 * Base interface for all MCP resources
 *
 * Defines the common properties that all MCP resources must implement.
 */
export interface McpResource {
  /** Unique identifier for the resource */
  uri: string;
  /** Human-readable name of the resource */
  name: string;
  /** Optional description of the resource */
  description?: string;
  /** MIME type of the resource content */
  mimeType?: string;
}

/**
 * Interface for MCP resource templates
 *
 * Defines the structure for resource templates, which are patterns for
 * dynamically addressing resources with parameters.
 */
export interface McpResourceTemplate {
  /** URI template with placeholders for parameters */
  uriTemplate: string;
  /** Human-readable name of the resource template */
  name: string;
  /** Optional description of the resource template */
  description?: string;
  /** MIME type of the resource content */
  mimeType?: string;
}

/**
 * Interface for MCP resource content
 *
 * Defines the structure for resource content that is returned when a resource is read.
 */
export interface McpResourceContent {
  /** URI of the resource */
  uri: string;
  /** MIME type of the content */
  mimeType?: string;
  /** Text content of the resource */
  text?: string;
  /** Binary content of the resource encoded as a string */
  blob?: string;
}

/**
 * Interface for file system resources
 *
 * Represents a file in the file system with metadata.
 */
export interface FileResource extends McpResource {
  /** URI format: file:///path/to/file */
  uri: string;
  /** Filename */
  name: string;
  /** File size in bytes */
  size?: number;
  /** Last modified timestamp */
  lastModified?: string;
}

/**
 * Interface for directory resources
 *
 * Represents a directory in the file system with metadata.
 */
export interface DirectoryResource extends McpResource {
  /** URI format: file:///path/to/directory/ */
  uri: string;
  /** Directory name */
  name: string;
  /** Number of entries in the directory */
  entryCount?: number;
}

/**
 * Interface for database resources
 *
 * Represents a database table or collection with metadata.
 */
export interface DatabaseResource extends McpResource {
  /** URI format: db://database-name/table-or-collection */
  uri: string;
  /** Database, table, or collection name */
  name: string;
  /** Number of rows or documents in the table or collection */
  rowCount?: number;
}

/**
 * Interface for document resources
 *
 * Represents a document in a document-oriented storage with metadata.
 */
export interface DocumentResource extends McpResource {
  /** URI format: doc://collection/document-id */
  uri: string;
  /** Document name or title */
  name: string;
  /** Document version identifier */
  version?: string;
  /** Document author identifier */
  author?: string;
}
