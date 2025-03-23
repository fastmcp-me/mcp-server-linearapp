/**
 * Linear API client module
 *
 * Initializes the Linear client and provides helper functions for
 * interacting with the Linear API and handling errors.
 * @module linear
 */

// Import using default import to handle CommonJS module
import pkg from '@linear/sdk';
import { config } from './config.js';

// Extract LinearClient class from the SDK
const { LinearClient } = pkg;

// Check if API key is available
if (!config.linear.apiKey) {
  console.error(
    'ERROR: LINEAR_API_KEY is not set in your .env file. Please add it to use Linear functionality.'
  );
}

/**
 * Initialized Linear API client
 *
 * Provides access to the Linear API using the configured API key.
 * Used by all Linear-related resources and tools.
 */
export const linearClient = new LinearClient({
  apiKey: config.linear.apiKey,
});

/**
 * Helper function to handle Linear API errors
 *
 * Logs the error to console and returns a standardized error object
 * that can be used in API responses.
 *
 * @param {unknown} error - The error thrown by the Linear API
 * @returns {Object} A standardized error object with an error message
 */
export const handleLinearError = (error: unknown): { error: string } => {
  console.error('Linear API Error:', error);
  return {
    error: 'Failed to fetch data from Linear API. Check server logs for details.',
  };
};
