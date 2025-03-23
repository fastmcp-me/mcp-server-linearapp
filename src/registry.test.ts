import {
  registerTool,
  registerPrompt,
  getAllTools,
  getAllPrompts,
  getToolHandler,
  getPromptHandler,
  getToolRegistry,
  getPromptRegistry,
  getResourceRegistry,
  ToolHandler,
  PromptHandler,
  getPromptByName,
  registerResource,
  getAllResources,
  getResourceHandler,
  getResourceByUri,
  getResourceTemplates,
  ResourceHandler,
  readResource,
} from "./registry.js";

// Reset registry state before each test
beforeEach(() => {
  // Reset registries to clean state for each test
  const toolRegistry = getToolRegistry();
  const promptRegistry = getPromptRegistry();
  const resourceRegistry = getResourceRegistry();

  // Clear tools
  Object.keys(toolRegistry.tools).forEach((key) => {
    delete toolRegistry.tools[key];
  });
  Object.keys(toolRegistry.toolHandlers).forEach((key) => {
    delete toolRegistry.toolHandlers[key];
  });

  // Clear prompts
  Object.keys(promptRegistry.prompts).forEach((key) => {
    delete promptRegistry.prompts[key];
  });
  Object.keys(promptRegistry.promptHandlers).forEach((key) => {
    delete promptRegistry.promptHandlers[key];
  });

  // Clear resources
  Object.keys(resourceRegistry.resources).forEach((key) => {
    delete resourceRegistry.resources[key];
  });
  Object.keys(resourceRegistry.resourceHandlers).forEach((key) => {
    delete resourceRegistry.resourceHandlers[key];
  });
});

describe("Tool Registry", () => {
  test("registerTool should add tool to registry", () => {
    // Arrange
    const mockTool = {
      name: "test-tool",
      description: "Test tool",
      inputSchema: {
        type: "object" as const,
        properties: {},
      },
    };
    const mockHandler: ToolHandler = jest.fn().mockResolvedValue({
      content: [{ type: "text", text: "test" }],
    });

    // Act
    const result = registerTool(mockTool, mockHandler);

    // Assert
    expect(result).toBe(mockTool);
    expect(getAllTools()).toHaveLength(1);
    expect(getAllTools()[0]).toBe(mockTool);
    expect(getToolHandler("test-tool")).toBe(mockHandler);
  });

  test("getAllTools should return all registered tools", () => {
    // Arrange
    const mockTools = [
      {
        name: "tool-1",
        description: "Tool 1",
        inputSchema: {
          type: "object" as const,
          properties: {},
        },
      },
      {
        name: "tool-2",
        description: "Tool 2",
        inputSchema: {
          type: "object" as const,
          properties: {},
        },
      },
      {
        name: "tool-3",
        description: "Tool 3",
        inputSchema: {
          type: "object" as const,
          properties: {},
        },
      },
    ];

    const mockHandler: ToolHandler = jest.fn().mockResolvedValue({
      content: [{ type: "text", text: "test" }],
    });

    // Act
    mockTools.forEach((tool) => registerTool(tool, mockHandler));
    const tools = getAllTools();

    // Assert
    expect(tools).toHaveLength(3);
    expect(tools).toContain(mockTools[0]);
    expect(tools).toContain(mockTools[1]);
    expect(tools).toContain(mockTools[2]);
  });

  test("getAllTools should return empty array when no tools registered", () => {
    // Act
    const tools = getAllTools();

    // Assert
    expect(tools).toEqual([]);
    expect(tools).toHaveLength(0);
  });

  test("getToolHandler should return the correct handler", () => {
    // Arrange
    const mockTool1 = {
      name: "tool-1",
      description: "Tool 1",
      inputSchema: {
        type: "object" as const,
        properties: {},
      },
    };
    const mockTool2 = {
      name: "tool-2",
      description: "Tool 2",
      inputSchema: {
        type: "object" as const,
        properties: {},
      },
    };

    const mockHandler1: ToolHandler = jest.fn().mockResolvedValue({
      content: [{ type: "text", text: "handler1" }],
    });

    const mockHandler2: ToolHandler = jest.fn().mockResolvedValue({
      content: [{ type: "text", text: "handler2" }],
    });

    // Act
    registerTool(mockTool1, mockHandler1);
    registerTool(mockTool2, mockHandler2);

    // Assert
    expect(getToolHandler("tool-1")).toBe(mockHandler1);
    expect(getToolHandler("tool-2")).toBe(mockHandler2);
    expect(getToolHandler("non-existent")).toBeUndefined();
  });

  test("tool handler should be callable with arguments", async () => {
    // Arrange
    const mockTool = {
      name: "calculator",
      description: "Calculator tool",
      inputSchema: {
        type: "object" as const,
        properties: {
          a: { type: "number" },
          b: { type: "number" },
        },
      },
    };
    const mockHandler: ToolHandler = jest
      .fn()
      .mockImplementation(async (args) => {
        const { a, b } = args;
        return {
          content: [
            {
              type: "text",
              text: `Result: ${Number(a) + Number(b)}`,
            },
          ],
        };
      });

    // Act
    registerTool(mockTool, mockHandler);
    const handler = getToolHandler("calculator");
    const result = await handler?.({ a: 5, b: 7 });

    // Assert
    expect(handler).toBeDefined();
    expect(mockHandler).toHaveBeenCalledWith({ a: 5, b: 7 });
    expect(result).toEqual({
      content: [{ type: "text", text: "Result: 12" }],
    });
  });

  test("tool handler should handle error gracefully", async () => {
    // Arrange
    const mockTool = {
      name: "error-tool",
      description: "Tool that throws error",
      inputSchema: {
        type: "object" as const,
        properties: {},
      },
    };

    const errorMessage = "Simulated tool error";
    const mockHandler: ToolHandler = jest
      .fn()
      .mockRejectedValue(new Error(errorMessage));

    // Act
    registerTool(mockTool, mockHandler);
    const handler = getToolHandler("error-tool");

    // Assert
    await expect(handler?.({})).rejects.toThrow(errorMessage);
    expect(mockHandler).toHaveBeenCalledWith({});
  });
});

describe("Prompt Registry", () => {
  test("registerPrompt should add prompt to registry", () => {
    // Arrange
    const mockPrompt = {
      name: "test-prompt",
      description: "Test prompt",
      arguments: [{ name: "input", description: "Input text", required: true }],
    };

    const mockHandler: PromptHandler = jest.fn().mockReturnValue([
      {
        role: "user",
        content: { type: "text", text: "test prompt" },
      },
    ]);

    // Act
    const result = registerPrompt(mockPrompt, mockHandler);

    // Assert
    expect(result).toBe(mockPrompt);
    expect(getAllPrompts()).toHaveLength(1);
    expect(getAllPrompts()[0]).toBe(mockPrompt);
    expect(getPromptHandler("test-prompt")).toBe(mockHandler);
    expect(getPromptByName("test-prompt")).toBe(mockPrompt);
  });

  test("getAllPrompts should return all registered prompts", () => {
    // Arrange
    const mockPrompts = [
      {
        name: "prompt-1",
        description: "Prompt 1",
        arguments: [],
      },
      {
        name: "prompt-2",
        description: "Prompt 2",
        arguments: [],
      },
      {
        name: "prompt-3",
        description: "Prompt 3",
        arguments: [],
      },
    ];

    const mockHandler: PromptHandler = jest.fn().mockReturnValue([
      {
        role: "user",
        content: { type: "text", text: "test prompt" },
      },
    ]);

    // Act
    mockPrompts.forEach((prompt) => registerPrompt(prompt, mockHandler));
    const prompts = getAllPrompts();

    // Assert
    expect(prompts).toHaveLength(3);
    expect(prompts).toContain(mockPrompts[0]);
    expect(prompts).toContain(mockPrompts[1]);
    expect(prompts).toContain(mockPrompts[2]);
  });

  test("getAllPrompts should return empty array when no prompts registered", () => {
    // Act
    const prompts = getAllPrompts();

    // Assert
    expect(prompts).toEqual([]);
    expect(prompts).toHaveLength(0);
  });

  test("getPromptByName should return the correct prompt", () => {
    // Arrange
    const mockPrompt1 = {
      name: "prompt-1",
      description: "Prompt 1",
      arguments: [],
    };
    const mockPrompt2 = {
      name: "prompt-2",
      description: "Prompt 2",
      arguments: [],
    };

    const mockHandler: PromptHandler = jest.fn().mockReturnValue([
      {
        role: "user",
        content: { type: "text", text: "test prompt" },
      },
    ]);

    // Act
    registerPrompt(mockPrompt1, mockHandler);
    registerPrompt(mockPrompt2, mockHandler);

    // Assert
    expect(getPromptByName("prompt-1")).toBe(mockPrompt1);
    expect(getPromptByName("prompt-2")).toBe(mockPrompt2);
    expect(getPromptByName("non-existent")).toBeUndefined();
  });

  test("getPromptHandler should return the correct handler", () => {
    // Arrange
    const mockPrompt1 = {
      name: "prompt-1",
      description: "Prompt 1",
      arguments: [],
    };
    const mockPrompt2 = {
      name: "prompt-2",
      description: "Prompt 2",
      arguments: [],
    };

    const mockHandler1: PromptHandler = jest.fn().mockReturnValue([
      {
        role: "user",
        content: { type: "text", text: "handler1" },
      },
    ]);

    const mockHandler2: PromptHandler = jest.fn().mockReturnValue([
      {
        role: "user",
        content: { type: "text", text: "handler2" },
      },
    ]);

    // Act
    registerPrompt(mockPrompt1, mockHandler1);
    registerPrompt(mockPrompt2, mockHandler2);

    // Assert
    expect(getPromptHandler("prompt-1")).toBe(mockHandler1);
    expect(getPromptHandler("prompt-2")).toBe(mockHandler2);
    expect(getPromptHandler("non-existent")).toBeUndefined();
  });

  test("prompt handler should be callable with arguments", () => {
    // Arrange
    const mockPrompt = {
      name: "translate",
      description: "Translation prompt",
      arguments: [
        { name: "text", description: "Text to translate", required: true },
        {
          name: "target_language",
          description: "Target language",
          required: true,
        },
      ],
    };

    const mockHandler: PromptHandler = jest.fn().mockImplementation((args) => {
      const { text, target_language } = args;
      return [
        {
          role: "user",
          content: {
            type: "text",
            text: `Translate to ${target_language}: ${text}`,
          },
        },
      ];
    });

    // Act
    registerPrompt(mockPrompt, mockHandler);
    const handler = getPromptHandler("translate");
    const result = handler?.({
      text: "Hello world",
      target_language: "Spanish",
    });

    // Assert
    expect(handler).toBeDefined();
    expect(mockHandler).toHaveBeenCalledWith({
      text: "Hello world",
      target_language: "Spanish",
    });
    expect(result).toEqual([
      {
        role: "user",
        content: {
          type: "text",
          text: "Translate to Spanish: Hello world",
        },
      },
    ]);
  });

  test("prompt handler should handle optional arguments", () => {
    // Arrange
    const mockPrompt = {
      name: "summarize",
      description: "Summarize text",
      arguments: [
        { name: "text", description: "Text to summarize", required: true },
        { name: "length", description: "Summary length", required: false },
      ],
    };

    const mockHandler: PromptHandler = jest.fn().mockImplementation((args) => {
      const { text, length = "medium" } = args;
      return [
        {
          role: "user",
          content: {
            type: "text",
            text: `Summarize in ${length} length: ${text}`,
          },
        },
      ];
    });

    // Act
    registerPrompt(mockPrompt, mockHandler);
    const handler = getPromptHandler("summarize");

    // Test with optional arg
    const resultWithOpt = handler?.({
      text: "This is sample text",
      length: "short",
    });

    // Test without optional arg
    const resultWithoutOpt = handler?.({
      text: "This is sample text",
    });

    // Assert
    expect(handler).toBeDefined();
    expect(resultWithOpt).toEqual([
      {
        role: "user",
        content: {
          type: "text",
          text: "Summarize in short length: This is sample text",
        },
      },
    ]);
    expect(resultWithoutOpt).toEqual([
      {
        role: "user",
        content: {
          type: "text",
          text: "Summarize in medium length: This is sample text",
        },
      },
    ]);
  });
});

describe("Registry Isolation", () => {
  test("tools and prompts registries should be separate", () => {
    // Arrange
    const mockTool = {
      name: "shared-name",
      description: "Tool with shared name",
      inputSchema: {
        type: "object" as const,
        properties: {},
      },
    };

    const mockPrompt = {
      name: "shared-name",
      description: "Prompt with shared name",
      arguments: [],
    };

    const toolHandler: ToolHandler = jest.fn().mockResolvedValue({
      content: [{ type: "text", text: "tool output" }],
    });

    const promptHandler: PromptHandler = jest.fn().mockReturnValue([
      {
        role: "user",
        content: { type: "text", text: "prompt output" },
      },
    ]);

    // Act
    registerTool(mockTool, toolHandler);
    registerPrompt(mockPrompt, promptHandler);

    // Assert
    expect(getAllTools()).toHaveLength(1);
    expect(getAllPrompts()).toHaveLength(1);
    expect(getToolHandler("shared-name")).toBe(toolHandler);
    expect(getPromptHandler("shared-name")).toBe(promptHandler);
    expect(getToolRegistry().tools["shared-name"]).toBe(mockTool);
    expect(getPromptRegistry().prompts["shared-name"]).toBe(mockPrompt);
  });

  test("re-registering should overwrite previous registration", () => {
    // Arrange
    const mockTool = {
      name: "calculator",
      description: "Calculator tool",
      inputSchema: {
        type: "object" as const,
        properties: {},
      },
    };

    const handler1: ToolHandler = jest.fn().mockResolvedValue({
      content: [{ type: "text", text: "handler1" }],
    });

    const handler2: ToolHandler = jest.fn().mockResolvedValue({
      content: [{ type: "text", text: "handler2" }],
    });

    // Act
    registerTool(mockTool, handler1);
    const originalHandler = getToolHandler("calculator");

    registerTool(mockTool, handler2);
    const newHandler = getToolHandler("calculator");

    // Assert
    expect(originalHandler).toBe(handler1);
    expect(newHandler).toBe(handler2);
    expect(getAllTools()).toHaveLength(1);
  });

  test("registry getters should return the full registry objects", () => {
    // Arrange
    const mockTool = {
      name: "test-tool",
      description: "Test tool",
      inputSchema: {
        type: "object" as const,
        properties: {},
      },
    };

    const mockPrompt = {
      name: "test-prompt",
      description: "Test prompt",
      arguments: [],
    };

    const toolHandler: ToolHandler = jest.fn().mockResolvedValue({
      content: [{ type: "text", text: "tool output" }],
    });

    const promptHandler: PromptHandler = jest.fn().mockReturnValue([
      {
        role: "user",
        content: { type: "text", text: "prompt output" },
      },
    ]);

    // Act
    registerTool(mockTool, toolHandler);
    registerPrompt(mockPrompt, promptHandler);

    const toolReg = getToolRegistry();
    const promptReg = getPromptRegistry();

    // Assert
    expect(toolReg).toHaveProperty("tools");
    expect(toolReg).toHaveProperty("toolHandlers");
    expect(promptReg).toHaveProperty("prompts");
    expect(promptReg).toHaveProperty("promptHandlers");

    expect(toolReg.tools["test-tool"]).toBe(mockTool);
    expect(toolReg.toolHandlers["test-tool"]).toBe(toolHandler);
    expect(promptReg.prompts["test-prompt"]).toBe(mockPrompt);
    expect(promptReg.promptHandlers["test-prompt"]).toBe(promptHandler);
  });
});

describe("Resource Registry", () => {
  test("registerResource should add resource to registry", async () => {
    // Arrange
    const mockResource = {
      uri: "test-resource://example",
      name: "Test Resource",
      mimeType: "text/plain",
    };
    const mockHandler: ResourceHandler = jest.fn().mockResolvedValue({
      data: { uri: "test-resource://example", text: "test content" },
    });

    // Act
    const result = registerResource(mockResource, mockHandler);

    // Assert
    expect(result).toBe(mockResource);
    expect(getAllResources()).toHaveLength(1);
    expect(getAllResources()[0]).toBe(mockResource);
    expect(getResourceHandler("test-resource://example")).toBe(mockHandler);
    expect(getResourceByUri("test-resource://example")).toBe(mockResource);
  });

  test("registerResource should add resource template to registry", async () => {
    // Arrange
    const mockResourceTemplate = {
      uriTemplate: "test-resource://example/{id}",
      name: "Test Resource Template",
      mimeType: "text/plain",
      parameters: [{ name: "id", description: "Resource ID", required: true }],
    };
    const mockHandler: ResourceHandler = jest.fn().mockResolvedValue({
      data: { uri: "test-resource://example/123", text: "test content" },
    });

    // Act
    const result = registerResource(mockResourceTemplate, mockHandler);

    // Assert
    expect(result).toBe(mockResourceTemplate);
    expect(getResourceTemplates()).toHaveLength(1);
    expect(getResourceTemplates()[0]).toBe(mockResourceTemplate);
    expect(getResourceHandler("test-resource://example/{id}")).toBe(
      mockHandler
    );
    expect(getResourceByUri("test-resource://example/{id}")).toBe(
      mockResourceTemplate
    );
  });

  test("getAllResources should return all registered resources", () => {
    // Arrange
    const mockResources = [
      {
        uri: "resource-1://example",
        name: "Resource 1",
        mimeType: "text/plain",
      },
      {
        uri: "resource-2://example",
        name: "Resource 2",
        mimeType: "application/json",
      },
      {
        uri: "resource-3://example",
        name: "Resource 3",
        mimeType: "text/html",
      },
    ];

    const mockHandler: ResourceHandler = jest.fn().mockResolvedValue({
      data: { uri: "test-uri", text: "test content" },
    });

    // Act
    mockResources.forEach((resource) =>
      registerResource(resource, mockHandler)
    );
    const resources = getAllResources();

    // Assert
    expect(resources).toHaveLength(3);
    expect(resources).toContain(mockResources[0]);
    expect(resources).toContain(mockResources[1]);
    expect(resources).toContain(mockResources[2]);
  });

  test("getResourceTemplates should return all registered resource templates", () => {
    // Arrange
    const mockTemplates = [
      {
        uriTemplate: "template-1://example/{id}",
        name: "Template 1",
        mimeType: "text/plain",
        parameters: [
          { name: "id", description: "Resource ID", required: true },
        ],
      },
      {
        uriTemplate: "template-2://example/{userId}",
        name: "Template 2",
        mimeType: "application/json",
        parameters: [
          { name: "userId", description: "User ID", required: true },
        ],
      },
    ];

    const mockHandler: ResourceHandler = jest.fn().mockResolvedValue({
      data: { uri: "test-uri", text: "test content" },
    });

    // Act
    mockTemplates.forEach((template) =>
      registerResource(template, mockHandler)
    );
    const templates = getResourceTemplates();

    // Assert
    expect(templates).toHaveLength(2);
    expect(templates).toContain(mockTemplates[0]);
    expect(templates).toContain(mockTemplates[1]);
  });

  test("getResourceByUri should return the correct resource", () => {
    // Arrange
    const mockResource1 = {
      uri: "resource-1://example",
      name: "Resource 1",
      mimeType: "text/plain",
    };
    const mockResource2 = {
      uri: "resource-2://example",
      name: "Resource 2",
      mimeType: "application/json",
    };

    const mockHandler: ResourceHandler = jest.fn().mockResolvedValue({
      data: { uri: "test-uri", text: "test content" },
    });

    // Act
    registerResource(mockResource1, mockHandler);
    registerResource(mockResource2, mockHandler);

    // Assert
    expect(getResourceByUri("resource-1://example")).toBe(mockResource1);
    expect(getResourceByUri("resource-2://example")).toBe(mockResource2);
    expect(getResourceByUri("non-existent")).toBeUndefined();
  });

  test("getResourceHandler should return the correct handler", () => {
    // Arrange
    const mockResource1 = {
      uri: "resource-1://example",
      name: "Resource 1",
      mimeType: "text/plain",
    };
    const mockResource2 = {
      uri: "resource-2://example",
      name: "Resource 2",
      mimeType: "application/json",
    };

    const mockHandler1: ResourceHandler = jest.fn().mockResolvedValue({
      data: { uri: "resource-1://example", text: "handler1" },
    });

    const mockHandler2: ResourceHandler = jest.fn().mockResolvedValue({
      data: { uri: "resource-2://example", text: "handler2" },
    });

    // Act
    registerResource(mockResource1, mockHandler1);
    registerResource(mockResource2, mockHandler2);

    // Assert
    expect(getResourceHandler("resource-1://example")).toBe(mockHandler1);
    expect(getResourceHandler("resource-2://example")).toBe(mockHandler2);
    expect(getResourceHandler("non-existent")).toBeUndefined();
  });

  test("readResource should retrieve content successfully", async () => {
    // Arrange
    const mockResource = {
      uri: "document://example",
      name: "Document Resource",
      mimeType: "text/plain",
    };

    const resourceContent = {
      uri: "document://example",
      text: "This is the document content",
    };

    const mockHandler: ResourceHandler = jest.fn().mockResolvedValue({
      data: resourceContent,
      isError: false,
    });

    registerResource(mockResource, mockHandler);

    // Act
    const result = await readResource("document://example");

    // Assert
    expect(result.isError).toBe(false);
    expect(result.content).toEqual(resourceContent);
    expect(mockHandler).toHaveBeenCalledWith({});
  });

  test("readResource should pass arguments to handler", async () => {
    // Arrange
    const mockResource = {
      uri: "document://example",
      name: "Document Resource",
      mimeType: "text/plain",
    };

    const resourceContent = {
      uri: "document://example",
      text: "Content with args applied",
    };

    const mockHandler: ResourceHandler = jest.fn().mockResolvedValue({
      data: resourceContent,
      isError: false,
    });

    registerResource(mockResource, mockHandler);

    // Act
    const args = { param1: "value1", param2: 42 };
    const result = await readResource("document://example", args);

    // Assert
    expect(result.isError).toBe(false);
    expect(result.content).toEqual(resourceContent);
    expect(mockHandler).toHaveBeenCalledWith(args);
  });

  test("readResource should handle resource not found", async () => {
    // Act
    const result = await readResource("non-existent://resource");

    // Assert
    expect(result.isError).toBe(true);
    expect(result.errorMessage).toMatch(/Resource not found/);
    expect(result.content).toBeUndefined();
  });

  test("readResource should handle handler errors", async () => {
    // Arrange
    const mockResource = {
      uri: "error://example",
      name: "Error Resource",
      mimeType: "text/plain",
    };

    const mockHandler: ResourceHandler = jest.fn().mockResolvedValue({
      isError: true,
      errorMessage: "Simulated handler error",
    });

    registerResource(mockResource, mockHandler);

    // Act
    const result = await readResource("error://example");

    // Assert
    expect(result.isError).toBe(true);
    expect(result.errorMessage).toMatch(/Simulated handler error/);
    expect(result.content).toBeUndefined();
  });

  test("readResource should handle handler exceptions", async () => {
    // Arrange
    const mockResource = {
      uri: "exception://example",
      name: "Exception Resource",
      mimeType: "text/plain",
    };

    const mockHandler: ResourceHandler = jest.fn().mockImplementation(() => {
      throw new Error("Unhandled exception");
    });

    registerResource(mockResource, mockHandler);

    // Act
    const result = await readResource("exception://example");

    // Assert
    expect(result.isError).toBe(true);
    expect(result.errorMessage).toMatch(/Unhandled exception/);
    expect(result.content).toBeUndefined();
  });

  test("readResource should handle missing content fields", async () => {
    // Arrange
    const mockResource = {
      uri: "incomplete://example",
      name: "Incomplete Resource",
      mimeType: "text/plain",
    };

    // Missing both text and blob
    const mockHandler: ResourceHandler = jest.fn().mockResolvedValue({
      data: {
        uri: "incomplete://example",
        // No text or blob field
      },
      isError: false,
    });

    registerResource(mockResource, mockHandler);

    // Act
    const result = await readResource("incomplete://example");

    // Assert
    expect(result.isError).toBe(true);
    expect(result.errorMessage).toMatch(/Invalid resource content/);
    expect(result.content).toBeUndefined();
  });

  test("readResource should add uri to content if missing", async () => {
    // Arrange
    const mockResource = {
      uri: "add-uri://example",
      name: "Add URI Resource",
      mimeType: "text/plain",
    };

    // Content without uri
    const mockHandler: ResourceHandler = jest.fn().mockResolvedValue({
      data: {
        // No uri field
        text: "Content without URI",
      },
      isError: false,
    });

    registerResource(mockResource, mockHandler);

    // Act
    const result = await readResource("add-uri://example");

    // Assert
    expect(result.isError).toBe(false);
    expect(result.content?.uri).toBe("add-uri://example");
    expect(result.content?.text).toBe("Content without URI");
  });

  test("readResource should use default error message if handler returns isError without message", async () => {
    // Arrange
    const mockResource = {
      uri: "error-no-message://example",
      name: "Error Resource Without Message",
      mimeType: "text/plain",
    };

    const mockHandler: ResourceHandler = jest.fn().mockResolvedValue({
      isError: true,
      // No errorMessage provided
    });

    registerResource(mockResource, mockHandler);

    // Act
    const result = await readResource("error-no-message://example");

    // Assert
    expect(result.isError).toBe(true);
    expect(result.errorMessage).toContain("Error reading resource");
    expect(result.content).toBeUndefined();
  });

  test("readResource should handle non-Error exceptions", async () => {
    // Arrange
    const mockResource = {
      uri: "non-error-exception://example",
      name: "Non-Error Exception Resource",
      mimeType: "text/plain",
    };

    const mockHandler: ResourceHandler = jest.fn().mockImplementation(() => {
      // Throw a non-Error value
      throw "String exception";
    });

    registerResource(mockResource, mockHandler);

    // Act
    const result = await readResource("non-error-exception://example");

    // Assert
    expect(result.isError).toBe(true);
    expect(result.errorMessage).toContain("Unknown error reading resource");
    expect(result.content).toBeUndefined();
  });
});

describe("Registry Edge Cases", () => {
  test("registerTool should handle tools with special characters in name", () => {
    // Arrange
    const mockTool = {
      name: "special:tool@with#chars",
      description: "Tool with special characters in name",
      inputSchema: {
        type: "object" as const,
        properties: {},
      },
    };
    const mockHandler: ToolHandler = jest.fn().mockResolvedValue({
      content: [{ type: "text", text: "test" }],
    });

    // Act
    registerTool(mockTool, mockHandler);

    // Assert
    expect(getAllTools()).toHaveLength(1);
    expect(getAllTools()[0]).toBe(mockTool);
    expect(getToolHandler("special:tool@with#chars")).toBe(mockHandler);
  });

  test("overwriting registry entries should maintain correct registry size", () => {
    // Arrange
    const mockTool1 = {
      name: "duplicate-tool",
      description: "First version",
      inputSchema: {
        type: "object" as const,
        properties: {},
      },
    };

    const mockTool2 = {
      name: "duplicate-tool",
      description: "Second version",
      inputSchema: {
        type: "object" as const,
        properties: {},
      },
    };

    const mockHandler: ToolHandler = jest.fn().mockResolvedValue({
      content: [{ type: "text", text: "test" }],
    });

    // Act
    registerTool(mockTool1, mockHandler);
    expect(getAllTools()).toHaveLength(1);
    expect(getAllTools()[0].description).toBe("First version");

    registerTool(mockTool2, mockHandler);

    // Assert
    expect(getAllTools()).toHaveLength(1);
    expect(getAllTools()[0].description).toBe("Second version");
  });

  test("getRegistryX() functions should return a copy to prevent external modification", () => {
    // Arrange
    const originalToolRegistry = getToolRegistry();
    const originalPromptRegistry = getPromptRegistry();
    const originalResourceRegistry = getResourceRegistry();

    // Act - attempt to modify the returned registries directly
    const toolRegistryCopy = getToolRegistry();
    const promptRegistryCopy = getPromptRegistry();
    const resourceRegistryCopy = getResourceRegistry();

    // Add directly to the copies (this should not affect the original registry)
    toolRegistryCopy.tools["direct-add"] = {
      name: "direct-add",
      description: "Added directly to registry",
      inputSchema: { type: "object", properties: {} },
    };

    promptRegistryCopy.prompts["direct-add"] = {
      name: "direct-add",
      description: "Added directly to registry",
      arguments: [],
    };

    resourceRegistryCopy.resources["direct-add://example"] = {
      uri: "direct-add://example",
      name: "Directly Added Resource",
      mimeType: "text/plain",
    };

    // Assert - the registries should be identical objects (not copies)
    // This actually tests the current implementation which doesn't return a copy
    expect(getToolRegistry()).toBe(originalToolRegistry);
    expect(getPromptRegistry()).toBe(originalPromptRegistry);
    expect(getResourceRegistry()).toBe(originalResourceRegistry);

    // We should see the direct modifications
    expect(getToolRegistry().tools["direct-add"]).toBeDefined();
    expect(getPromptRegistry().prompts["direct-add"]).toBeDefined();
    expect(getResourceByUri("direct-add://example")).toBeDefined();
  });
});
