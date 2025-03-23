import { linearClient } from '../linear.js';
import {
  linearOrganizationResourceHandler,
  LinearOrganizationResponse,
} from './linear-organization.js';

// Mock the Linear client
jest.mock('../linear.js', () => ({
  linearClient: {
    organization: undefined,
  },
}));

describe('Organization Resources', () => {
  // Clear all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('linearOrganizationResourceHandler', () => {
    const mockOrganization = {
      id: 'org123',
      name: 'Acme Inc',
      urlKey: 'acme',
      logoUrl: 'https://example.com/logo.png',
    };

    it('should return organization data', async () => {
      // Setup mocks
      (linearClient as any).organization = mockOrganization;

      // Call the handler
      const result = await linearOrganizationResourceHandler({});

      // Verify the result
      expect(result.isError).toBe(false);

      // Parse response
      const responseData = JSON.parse((result.data as any).text) as LinearOrganizationResponse;

      // Check organization data
      expect(responseData).toMatchObject({
        id: 'org123',
        name: 'Acme Inc',
        urlKey: 'acme',
        logoUrl: 'https://example.com/logo.png',
      });
    });

    it('should return an error when organization is not available', async () => {
      // Setup mocks
      (linearClient as any).organization = null;

      // Call the handler
      const result = await linearOrganizationResourceHandler({});

      // Verify the result
      expect(result.isError).toBe(true);
      expect(result.errorMessage).toBe('Failed to fetch organization');
      expect(result.data).toBeNull();
    });

    it('should handle API errors gracefully', async () => {
      // Setup mocks to throw error when accessing the organization property
      Object.defineProperty(linearClient, 'organization', {
        get: jest.fn().mockImplementation(() => {
          throw new Error('API error');
        }),
      });

      // Call the handler
      const result = await linearOrganizationResourceHandler({});

      // Verify the result
      expect(result.isError).toBe(true);
      expect(result.errorMessage).toBe('Error: API error');
      expect(result.data).toBeNull();
    });
  });
});
