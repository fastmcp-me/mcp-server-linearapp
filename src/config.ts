/**
 * Configuration module for the Linear MCP server
 *
 * Handles loading environment variables, configuration validation,
 * and URL construction for API requests.
 * @module config
 */
import 'dotenv/config';

// Load environment variables
const env = process.env;

/**
 * Server configuration object
 *
 * Contains all configuration parameters for the Linear MCP server,
 * including API keys and server settings.
 */
export const config = {
  // Linear API Configuration
  linear: {
    /** Linear API key from environment variables */
    apiKey: env.LINEAR_API_KEY || '',
  },

  // Server Configuration
  server: {
    /** Server port, defaults to 3124 if not specified */
    port: parseInt(env.PORT || '3124', 10),
    /** Log level, defaults to "info" if not specified */
    logLevel: env.LOG_LEVEL || 'info',
  },
};

/**
 * Validates the required configuration parameters
 *
 * Checks that all required environment variables are set.
 * Throws an error if any required variables are missing.
 *
 * @throws {Error} If any required environment variables are not set
 */
export function validateConfig(): void {
  const requiredEnvVars = [{ key: 'LINEAR_API_KEY', value: config.linear.apiKey }];

  const missingVars = requiredEnvVars.filter(envVar => !envVar.value);

  if (missingVars.length > 0) {
    const missingKeys = missingVars.map(envVar => envVar.key).join(', ');
    throw new Error(`Missing required environment variables: ${missingKeys}`);
  }
}

/** API Key for external API requests */
export const API_KEY = process.env.API_KEY;
/** Base URL for API endpoints */
export const API_BASE_URL = process.env.API_BASE_URL || 'https://api.example.com/v1';

/**
 * Builds a URL with query parameters for API requests
 *
 * Constructs a URL from the base API URL and endpoint, and adds query parameters
 * including the API key and any additional parameters provided.
 *
 * @param {string} endpoint - The API endpoint path
 * @param {Record<string, string | number>} params - Query parameters to include in the URL
 * @returns {string} The constructed URL with query parameters
 */
export function buildUrl(endpoint: string, params: Record<string, string | number>): string {
  const baseUrl = `${API_BASE_URL}/${endpoint}`;
  const url = new URL(baseUrl);
  url.searchParams.append('api_key', API_KEY as string);

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value.toString());
  });

  return url.toString();
}
