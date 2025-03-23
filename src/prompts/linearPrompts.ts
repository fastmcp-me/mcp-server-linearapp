import { registerPrompt, PromptHandler } from "../registry.js";

// Handler for Linear bug report prompt
const linearBugReportPromptHandler: PromptHandler = (args) => {
  const title = args.title || "Bug Report";
  const description = args.description || "Please describe the bug in detail";

  return [
    {
      role: "user",
      content: {
        type: "text",
        text: `I want to create a bug report in Linear with the following information:
  
Title: ${title}

Description:
${description}

Please help me create this bug report in Linear and assign it to the appropriate team.`,
      },
    },
  ];
};

// Handler for Linear feature request prompt
const linearFeatureRequestPromptHandler: PromptHandler = (args) => {
  const title = args.title || "Feature Request";
  const description =
    args.description || "Please describe the feature you would like to see";

  return [
    {
      role: "user",
      content: {
        type: "text",
        text: `I want to create a feature request in Linear with the following information:
  
Title: ${title}

Description:
${description}

Please help me create this feature request in Linear, assign it to the appropriate team, and add relevant labels.`,
      },
    },
  ];
};

// Register prompts
export const linearBugReportPrompt = registerPrompt(
  {
    name: "linear_bug_report",
    description: "Creates a bug report in Linear",
    argsSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Title of the bug report",
        },
        description: {
          type: "string",
          description: "Detailed description of the bug",
        },
      },
    },
  },
  linearBugReportPromptHandler
);

export const linearFeatureRequestPrompt = registerPrompt(
  {
    name: "linear_feature_request",
    description: "Creates a feature request in Linear",
    argsSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Title of the feature request",
        },
        description: {
          type: "string",
          description: "Detailed description of the requested feature",
        },
      },
    },
  },
  linearFeatureRequestPromptHandler
);
