import { google } from "@ai-sdk/google";
import {
  LanguageModelV1,
  LanguageModelV1FinishReason,
  LanguageModelV1StreamPart,
  LanguageModelV1Message,
} from "@ai-sdk/provider";

const MODEL = "gemini-2.5-flash";

export class MockLanguageModel {
  readonly specificationVersion = "v1" as const;
  readonly provider = "mock";
  readonly modelId: string;
  readonly defaultObjectGenerationMode = "tool" as const;

  constructor(modelId: string) {
    this.modelId = modelId;
  }

  private async delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private extractUserPrompt(messages: LanguageModelV1Message[]): string {
    // Find the last user message
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (message.role === "user") {
        const content = message.content;
        if (Array.isArray(content)) {
          // Extract text from content parts
          const textParts = content
            .filter((part: any) => part.type === "text")
            .map((part: any) => (part as any).text);
          return textParts.join(" ");
        } else if (typeof content === "string") {
          return content;
        }
      }
    }
    return "";
  }

  private async *generateMockStream(
    messages: LanguageModelV1Message[],
    userPrompt: string
  ): AsyncGenerator<LanguageModelV1StreamPart> {
    // Count tool messages to determine which step we're on
    const toolMessageCount = messages.filter((m) => m.role === "tool").length;

    // Determine component type from the original user prompt
    const promptLower = userPrompt.toLowerCase();
    let componentType = "counter";
    let componentName = "Counter";

    if (promptLower.includes("form")) {
      componentType = "form";
      componentName = "ContactForm";
    } else if (promptLower.includes("card")) {
      componentType = "card";
      componentName = "Card";
    }

    // Step 1: Create component file
    if (toolMessageCount === 1) {
      const text = `I'll create a ${componentName} component for you.`;
      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(25);
      }

      yield {
        type: "tool-call",
        toolCallType: "function",
        toolCallId: `call_1`,
        toolName: "str_replace_editor",
        args: JSON.stringify({
          command: "create",
          path: `/components/${componentName}.jsx`,
          file_text: this.getComponentCode(componentType),
        }),
      };

      yield {
        type: "finish",
        finishReason: "tool-calls",
        usage: {
          promptTokens: 50,
          completionTokens: 30,
        },
      };
      return;
    }

    // Step 2: Enhance component
    if (toolMessageCount === 2) {
      const text = `Now let me enhance the component with better styling.`;
      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(25);
      }

      yield {
        type: "tool-call",
        toolCallType: "function",
        toolCallId: `call_2`,
        toolName: "str_replace_editor",
        args: JSON.stringify({
          command: "str_replace",
          path: `/components/${componentName}.jsx`,
          old_str: this.getOldStringForReplace(componentType),
          new_str: this.getNewStringForReplace(componentType),
        }),
      };

      yield {
        type: "finish",
        finishReason: "tool-calls",
        usage: {
          promptTokens: 50,
          completionTokens: 30,
        },
      };
      return;
    }

    // Step 3: Create App.jsx
    if (toolMessageCount === 0) {
      const text = `This is a static response. You can place a Google Gemini API key in the .env file to use the Gemini API for component generation. Let me create an App.jsx file to display the component.`;
      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(15);
      }

      yield {
        type: "tool-call",
        toolCallType: "function",
        toolCallId: `call_3`,
        toolName: "str_replace_editor",
        args: JSON.stringify({
          command: "create",
          path: "/App.jsx",
          file_text: this.getAppCode(componentName),
        }),
      };

      yield {
        type: "finish",
        finishReason: "tool-calls",
        usage: {
          promptTokens: 50,
          completionTokens: 30,
        },
      };
      return;
    }

    // Step 4: Final summary (no tool call)
    if (toolMessageCount >= 3) {
      const text = `Perfect! I've created:

1. **${componentName}.jsx** - A fully-featured ${componentType} component
2. **App.jsx** - The main app file that displays the component

The component is now ready to use. You can see the preview on the right side of the screen.`;

      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(30);
      }

      yield {
        type: "finish",
        finishReason: "stop",
        usage: {
          promptTokens: 50,
          completionTokens: 50,
        },
      };
      return;
    }
  }

  private getComponentCode(componentType: string): string {
    switch (componentType) {
      case "form":
        return `import React, { useState } from 'react';

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Handle form submission here
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Contact Us</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
        >
          Send Message
        </button>
      </form>
    </div>
  );
};

export default ContactForm;`;

      case "card":
        return `import React from 'react';

const Card = ({ 
  title = "Welcome to Our Service", 
  description = "Discover amazing features and capabilities that will transform your experience.",
  imageUrl,
  actions 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {imageUrl && (
        <img 
          src={imageUrl} 
          alt={title}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{description}</p>
        {actions && (
          <div className="mt-4">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default Card;`;

      default:
        return `import { useState } from 'react';

const Counter = () => {
  const [count, setCount] = useState(0);

  const increment = () => {
    setCount(count + 1);
  };

  const decrement = () => {
    setCount(count - 1);
  };

  const reset = () => {
    setCount(0);
  };

  return (
    <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Counter</h2>
      <div className="text-4xl font-bold mb-6">{count}</div>
      <div className="flex gap-4">
        <button 
          onClick={decrement}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Decrease
        </button>
        <button 
          onClick={reset}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
        >
          Reset
        </button>
        <button 
          onClick={increment}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          Increase
        </button>
      </div>
    </div>
  );
};

export default Counter;`;
    }
  }

  private getOldStringForReplace(componentType: string): string {
    switch (componentType) {
      case "form":
        return "    console.log('Form submitted:', formData);";
      case "card":
        return '      <div className="p-6">';
      default:
        return "  const increment = () => setCount(count + 1);";
    }
  }

  private getNewStringForReplace(componentType: string): string {
    switch (componentType) {
      case "form":
        return "    console.log('Form submitted:', formData);\n    alert('Thank you! We\\'ll get back to you soon.');";
      case "card":
        return '      <div className="p-6 hover:bg-gray-50 transition-colors">';
      default:
        return "  const increment = () => setCount(prev => prev + 1);";
    }
  }

  private getAppCode(componentName: string): string {
    if (componentName === "Card") {
      return `import Card from '@/components/Card';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <Card 
          title="Amazing Product"
          description="This is a fantastic product that will change your life. Experience the difference today!"
          actions={
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
              Learn More
            </button>
          }
        />
      </div>
    </div>
  );
}`;
    }

    return `import ${componentName} from '@/components/${componentName}';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <${componentName} />
      </div>
    </div>
  );
}`;
  }

  async doGenerate(
    options: Parameters<LanguageModelV1["doGenerate"]>[0]
  ): Promise<Awaited<ReturnType<LanguageModelV1["doGenerate"]>>> {
    const userPrompt = this.extractUserPrompt(options.prompt);

    // Collect all stream parts
    const parts: LanguageModelV1StreamPart[] = [];
    for await (const part of this.generateMockStream(
      options.prompt,
      userPrompt
    )) {
      parts.push(part);
    }

    // Build response from parts
    const textParts = parts
      .filter((p) => p.type === "text-delta")
      .map((p) => (p as any).textDelta)
      .join("");

    const toolCalls = parts
      .filter((p) => p.type === "tool-call")
      .map((p) => ({
        toolCallType: "function" as const,
        toolCallId: (p as any).toolCallId,
        toolName: (p as any).toolName,
        args: (p as any).args,
      }));

    // Get finish reason from finish part
    const finishPart = parts.find((p) => p.type === "finish") as any;
    const finishReason = finishPart?.finishReason || "stop";

    return {
      text: textParts,
      toolCalls,
      finishReason: finishReason as any,
      usage: {
        promptTokens: 100,
        completionTokens: 200,
      },
      warnings: [],
      rawCall: {
        rawPrompt: options.prompt,
        rawSettings: {
          maxTokens: options.maxTokens,
          temperature: options.temperature,
        },
      },
    };
  }

  async doStream(
    options: Parameters<LanguageModelV1["doStream"]>[0]
  ): Promise<Awaited<ReturnType<LanguageModelV1["doStream"]>>> {
    const userPrompt = this.extractUserPrompt(options.prompt);
    const self = this;

    const stream = new ReadableStream<LanguageModelV1StreamPart>({
      async start(controller) {
        try {
          const generator = self.generateMockStream(options.prompt, userPrompt);
          for await (const chunk of generator) {
            controller.enqueue(chunk);
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return {
      stream,
      warnings: [],
      rawCall: {
        rawPrompt: options.prompt,
        rawSettings: {},
      },
      rawResponse: { headers: {} },
    };
  }
}

type LanguageModelV1GenerateResult = Awaited<
  ReturnType<LanguageModelV1["doGenerate"]>
>;

type LanguageModelV1StreamResult = Awaited<
  ReturnType<LanguageModelV1["doStream"]>
>;

function normalizeFinishReason(
  finishReason: unknown
): LanguageModelV1FinishReason {
  if (typeof finishReason === "string") {
    return finishReason as LanguageModelV1FinishReason;
  }

  if (
    finishReason &&
    typeof finishReason === "object" &&
    "unified" in finishReason &&
    typeof finishReason.unified === "string"
  ) {
    return finishReason.unified as LanguageModelV1FinishReason;
  }

  return "unknown";
}

function normalizeUsage(usage: unknown) {
  if (!usage || typeof usage !== "object") {
    return {
      promptTokens: 0,
      completionTokens: 0,
    };
  }

  const usageRecord = usage as Record<string, unknown>;

  if ("promptTokens" in usageRecord || "completionTokens" in usageRecord) {
    return {
      promptTokens:
        typeof usageRecord.promptTokens === "number"
          ? usageRecord.promptTokens
          : 0,
      completionTokens:
        typeof usageRecord.completionTokens === "number"
          ? usageRecord.completionTokens
          : 0,
    };
  }

  const inputTokens =
    "inputTokens" in usageRecord &&
    usageRecord.inputTokens &&
    typeof usageRecord.inputTokens === "object" &&
    "total" in usageRecord.inputTokens &&
    typeof usageRecord.inputTokens.total === "number"
      ? usageRecord.inputTokens.total
      : 0;

  const outputTokens =
    "outputTokens" in usageRecord &&
    usageRecord.outputTokens &&
    typeof usageRecord.outputTokens === "object" &&
    "total" in usageRecord.outputTokens &&
    typeof usageRecord.outputTokens.total === "number"
      ? usageRecord.outputTokens.total
      : 0;

  return {
    promptTokens: inputTokens,
    completionTokens: outputTokens,
  };
}

function normalizeToolArgs(args: unknown) {
  if (typeof args === "string") {
    return args;
  }

  return JSON.stringify(args ?? {});
}

function normalizeStreamPart(chunk: any): LanguageModelV1StreamPart | null {
  switch (chunk?.type) {
    case "stream-start":
    case "raw":
    case "text-start":
    case "text-end":
    case "reasoning-start":
    case "reasoning-end":
    case "tool-input-start":
    case "tool-input-delta":
    case "tool-input-end":
    case "tool-result":
      return null;

    case "text-delta":
      return {
        type: "text-delta",
        textDelta:
          typeof chunk.textDelta === "string"
            ? chunk.textDelta
            : typeof chunk.delta === "string"
            ? chunk.delta
            : "",
      };

    case "reasoning":
      return {
        type: "reasoning",
        textDelta: typeof chunk.textDelta === "string" ? chunk.textDelta : "",
      };

    case "reasoning-delta":
      return {
        type: "reasoning",
        textDelta: typeof chunk.delta === "string" ? chunk.delta : "",
      };

    case "reasoning-signature":
      return {
        type: "reasoning-signature",
        signature: typeof chunk.signature === "string" ? chunk.signature : "",
      };

    case "redacted-reasoning":
      return {
        type: "redacted-reasoning",
        data: typeof chunk.data === "string" ? chunk.data : "",
      };

    case "source":
      return {
        type: "source",
        source: chunk.source,
      };

    case "file":
      return {
        type: "file",
        mimeType:
          typeof chunk.mimeType === "string"
            ? chunk.mimeType
            : typeof chunk.mediaType === "string"
            ? chunk.mediaType
            : "application/octet-stream",
        data: chunk.data,
      };

    case "tool-call":
      return {
        type: "tool-call",
        toolCallType: "function",
        toolCallId:
          typeof chunk.toolCallId === "string" ? chunk.toolCallId : "",
        toolName: typeof chunk.toolName === "string" ? chunk.toolName : "",
        args: normalizeToolArgs(chunk.args ?? chunk.input),
      };

    case "tool-call-delta":
      return {
        type: "tool-call-delta",
        toolCallType: "function",
        toolCallId:
          typeof chunk.toolCallId === "string" ? chunk.toolCallId : "",
        toolName: typeof chunk.toolName === "string" ? chunk.toolName : "",
        argsTextDelta:
          typeof chunk.argsTextDelta === "string"
            ? chunk.argsTextDelta
            : typeof chunk.delta === "string"
            ? chunk.delta
            : "",
      };

    case "response-metadata":
      return {
        type: "response-metadata",
        id: typeof chunk.id === "string" ? chunk.id : undefined,
        timestamp:
          chunk.timestamp instanceof Date
            ? chunk.timestamp
            : typeof chunk.timestamp === "string"
            ? new Date(chunk.timestamp)
            : undefined,
        modelId: typeof chunk.modelId === "string" ? chunk.modelId : undefined,
      };

    case "finish":
      return {
        type: "finish",
        finishReason: normalizeFinishReason(chunk.finishReason),
        usage: normalizeUsage(chunk.usage),
        providerMetadata: chunk.providerMetadata,
        logprobs: chunk.logprobs,
      };

    case "error":
      return {
        type: "error",
        error: chunk.error,
      };

    default:
      return null;
  }
}

function createCompatibleStream(stream: ReadableStream<any>) {
  return stream.pipeThrough(
    new TransformStream<any, LanguageModelV1StreamPart>({
      transform(chunk, controller) {
        const normalizedChunk = normalizeStreamPart(chunk);

        if (normalizedChunk) {
          controller.enqueue(normalizedChunk);
        }
      },
    })
  );
}

async function readGenerateResultFromStream(
  streamResult: LanguageModelV1StreamResult
): Promise<LanguageModelV1GenerateResult> {
  const reader = streamResult.stream.getReader();
  let text = "";
  let reasoning = "";
  const toolCalls: NonNullable<LanguageModelV1GenerateResult["toolCalls"]> = [];
  let finishReason: LanguageModelV1FinishReason = "unknown";
  let usage = {
    promptTokens: 0,
    completionTokens: 0,
  };
  let providerMetadata: LanguageModelV1GenerateResult["providerMetadata"];

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      switch (value.type) {
        case "text-delta":
          text += value.textDelta;
          break;

        case "reasoning":
          reasoning += value.textDelta;
          break;

        case "tool-call":
          toolCalls.push({
            toolCallType: value.toolCallType,
            toolCallId: value.toolCallId,
            toolName: value.toolName,
            args: value.args,
          });
          break;

        case "finish":
          finishReason = value.finishReason;
          usage = value.usage;
          providerMetadata = value.providerMetadata;
          break;

        default:
          break;
      }
    }
  } finally {
    reader.releaseLock();
  }

  return {
    ...(text ? { text } : {}),
    ...(reasoning ? { reasoning } : {}),
    ...(toolCalls.length > 0 ? { toolCalls } : {}),
    finishReason,
    usage,
    rawCall: streamResult.rawCall,
    ...(streamResult.rawResponse ? { rawResponse: streamResult.rawResponse } : {}),
    ...(streamResult.request ? { request: streamResult.request } : {}),
    ...(streamResult.warnings ? { warnings: streamResult.warnings } : {}),
    ...(providerMetadata ? { providerMetadata } : {}),
  };
}

function createCompatibleGeminiModel(model: any): LanguageModelV1 {
  const doStream: LanguageModelV1["doStream"] = async (options) => {
    const result = await model.doStream(options);

    return {
      ...result,
      stream: createCompatibleStream(result.stream),
    };
  };

  return {
    specificationVersion: "v1",
    provider: typeof model.provider === "string" ? model.provider : "google",
    modelId: typeof model.modelId === "string" ? model.modelId : MODEL,
    defaultObjectGenerationMode:
      model.defaultObjectGenerationMode ?? "tool",
    supportsImageUrls: model.supportsImageUrls,
    supportsStructuredOutputs: model.supportsStructuredOutputs,
    supportsUrl:
      typeof model.supportsUrl === "function"
        ? (url) => model.supportsUrl(url)
        : undefined,
    doGenerate: async (options) => readGenerateResultFromStream(await doStream(options)),
    doStream,
  };
}

export function getLanguageModel(): any {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();

  if (!apiKey || apiKey === "your-api-key-here" || apiKey === "") {
    console.log(
      "GOOGLE_GENERATIVE_AI_API_KEY is not set (or is still the placeholder). " +
        "Using the mock provider — responses will be canned. " +
        "Set a real key in .env to generate components with Gemini."
    );
    return new MockLanguageModel("mock-" + MODEL);
  }

  return createCompatibleGeminiModel(google(MODEL));
}
