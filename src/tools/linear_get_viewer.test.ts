/**
 * Unit tests for the Linear Get Viewer tool
 *
 * These tests verify that the tool properly retrieves authenticated user details
 * and handles error cases appropriately.
 */
import { linearGetViewerHandler } from './linear_get_viewer.js';
import { linearClient } from '../linear.js';

// Mock the Linear client
jest.mock('../linear.js', () => ({
  linearClient: {
    // The viewer property will be defined in individual tests
  },
}));

describe('Linear Get Viewer Tool', () => {
  // Reset mocks between tests
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return viewer data when authenticated', async () => {
    // Mock viewer data
    const mockViewer = {
      id: Promise.resolve('user123'),
      name: Promise.resolve('John Doe'),
      displayName: Promise.resolve('John Doe'),
      email: Promise.resolve('john@example.com'),
      active: Promise.resolve(true),
      admin: Promise.resolve(false),
      avatarUrl: Promise.resolve('https://example.com/avatar.png'),
      url: Promise.resolve('https://linear.app/users/user123'),
    };

    // Set up the mock viewer property
    Object.defineProperty(linearClient, 'viewer', {
      get: jest.fn().mockResolvedValue(mockViewer),
      configurable: true,
    });

    // Call the handler with an empty object as argument
    const result = await linearGetViewerHandler({});

    // Verify success response
    expect(result.isError).toBeFalsy();

    // Parse the response JSON
    const responseData = JSON.parse(result.content[0].text);

    // Verify response contains expected fields
    expect(responseData).toHaveProperty('id', 'user123');
    expect(responseData).toHaveProperty('name', 'John Doe');
    expect(responseData).toHaveProperty('displayName', 'John Doe');
    expect(responseData).toHaveProperty('email', 'john@example.com');
    expect(responseData).toHaveProperty('active', true);
    expect(responseData).toHaveProperty('admin', false);
    expect(responseData).toHaveProperty('avatarUrl', 'https://example.com/avatar.png');
    expect(responseData).toHaveProperty('url', 'https://linear.app/users/user123');
  });

  it('should handle when viewer is not available', async () => {
    // Set up the mock viewer property to return null
    Object.defineProperty(linearClient, 'viewer', {
      get: jest.fn().mockResolvedValue(null),
      configurable: true,
    });

    // Call the handler with an empty object as argument
    const result = await linearGetViewerHandler({});

    // Verify error response
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Error: Failed to get authenticated user');
  });

  it('should handle API errors gracefully', async () => {
    // Set up the mock viewer property to throw an error
    Object.defineProperty(linearClient, 'viewer', {
      get: jest.fn().mockRejectedValue(new Error('API connection failed')),
      configurable: true,
    });

    // Call the handler with an empty object as argument
    const result = await linearGetViewerHandler({});

    // Verify error response
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Error: API connection failed');
  });
});
