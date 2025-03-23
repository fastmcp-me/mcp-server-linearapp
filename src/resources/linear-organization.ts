/**
 * Linear Organization Resources Module
 *
 * Defines resource templates and handlers for Linear organization resources.
 *
 * @module resources/linear-organization
 */
import { McpResource, McpResourceContent } from '../types.js';
import { registerResource, ResourceHandler, ResourceResponse } from '../registry.js';
import { linearClient } from '../linear.js';

/**
 * Linear organization resource
 *
 * Resource for accessing information about the Linear organization.
 */
const linearOrganizationResource: McpResource = {
  uri: 'linear-organization:',
  name: 'linear-organization',
  description: 'Linear organization information',
  mimeType: 'application/json',
};

export interface LinearOrganizationResponse {
  id: string;
  name: string;
  urlKey: string;
  logoUrl?: string;
}

/**
 * Handler for Linear organization resource
 */
export const linearOrganizationResourceHandler: ResourceHandler = async (): Promise<
  ResourceResponse<McpResourceContent | null>
> => {
  try {
    // Fetch the organization from Linear
    const organization = await linearClient.organization;
    if (!organization) {
      return {
        isError: true,
        errorMessage: 'Failed to fetch organization',
        data: null,
      };
    }

    const organizationData = {
      id: organization.id,
      name: organization.name,
      urlKey: organization.urlKey,
      logoUrl: organization.logoUrl,
    } as LinearOrganizationResponse;

    return {
      data: {
        uri: 'linear-organization:',
        mimeType: 'application/json',
        text: JSON.stringify(organizationData),
      },
      isError: false,
    };
  } catch (error) {
    return {
      isError: true,
      errorMessage: typeof error === 'string' ? error : String(error),
      data: null,
    };
  }
};

// Register the Linear organization resource
registerResource(linearOrganizationResource, linearOrganizationResourceHandler);
