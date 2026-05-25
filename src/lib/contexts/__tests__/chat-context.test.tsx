import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act, cleanup } from "@testing-library/react";
import { ChatProvider, useChat } from "../chat-context";
import { useFileSystem } from "../file-system-context";
import { useChat as useAIChat } from "@ai-sdk/react";
import * as anonTracker from "@/lib/anon-work-tracker";

// Mock dependencies
vi.mock("../file-system-context", () => ({
  useFileSystem: vi.fn(),
}));

vi.mock("@ai-sdk/react", () => ({
  useChat: vi.fn(),
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  setHasAnonWork: vi.fn(),
}));

// Helper component to access chat context
function TestComponent() {
  const chat = useChat();
  return (
    <div>
      <div data-testid="messages">{chat.messages.length}</div>
      <textarea
        data-testid="input"
        value={chat.input}
        onChange={chat.handleInputChange}
      />
      <form data-testid="form" onSubmit={chat.handleSubmit}>
        <button type="submit">Submit</button>
      </form>
      <div data-testid="status">{chat.status}</div>
      <div data-testid="error">{chat.errorMessage ?? ""}</div>
      <div data-testid="retryable">{String(chat.canRetryError)}</div>
      <button data-testid="retry" onClick={() => void chat.retryLastMessage()}>
        Retry
      </button>
    </div>
  );
}

describe("ChatContext", () => {
  const mockFileSystem = {
    serialize: vi.fn(() => ({ "/test.js": { type: "file", content: "test" } })),
  };

  const mockHandleToolCall = vi.fn();
  const mockApplyGeneratedFiles = vi.fn();

  const mockUseAIChat = {
    messages: [],
    input: "",
    handleInputChange: vi.fn(),
    handleSubmit: vi.fn(),
    status: "idle",
    error: undefined,
    reload: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    (useFileSystem as any).mockReturnValue({
      fileSystem: mockFileSystem,
      handleToolCall: mockHandleToolCall,
      applyGeneratedFiles: mockApplyGeneratedFiles,
    });

    (useAIChat as any).mockReturnValue(mockUseAIChat);
  });

  afterEach(() => {
    cleanup();
  });

  test("renders with default values", () => {
    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );

    expect(screen.getByTestId("messages").textContent).toBe("0");
    expect(screen.getByTestId("input").getAttribute("value")).toBe(null);
    expect(screen.getByTestId("status").textContent).toBe("idle");
    expect(screen.getByTestId("error").textContent).toBe("");
    expect(screen.getByTestId("retryable").textContent).toBe("false");
  });

  test("initializes with project ID and messages", () => {
    const initialMessages = [
      { id: "1", role: "user" as const, content: "Hello" },
      { id: "2", role: "assistant" as const, content: "Hi there!" },
    ];

    (useAIChat as any).mockReturnValue({
      ...mockUseAIChat,
      messages: initialMessages,
    });

    render(
      <ChatProvider projectId="test-project" initialMessages={initialMessages}>
        <TestComponent />
      </ChatProvider>
    );

    expect(useAIChat).toHaveBeenCalledWith({
      api: "/api/chat",
      initialMessages,
      body: {
        files: mockFileSystem.serialize(),
        projectId: "test-project",
      },
      onToolCall: expect.any(Function),
    });

    expect(screen.getByTestId("messages").textContent).toBe("2");
  });

  test("tracks anonymous work when no project ID", async () => {
    const mockMessages = [{ id: "1", role: "user", content: "Hello" }];

    (useAIChat as any).mockReturnValue({
      ...mockUseAIChat,
      messages: mockMessages,
    });

    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );

    await waitFor(() => {
      expect(anonTracker.setHasAnonWork).toHaveBeenCalledWith(
        mockMessages,
        mockFileSystem.serialize()
      );
    });
  });

  test("does not track anonymous work when project ID exists", async () => {
    const mockMessages = [{ id: "1", role: "user", content: "Hello" }];

    (useAIChat as any).mockReturnValue({
      ...mockUseAIChat,
      messages: mockMessages,
    });

    render(
      <ChatProvider projectId="test-project">
        <TestComponent />
      </ChatProvider>
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(anonTracker.setHasAnonWork).not.toHaveBeenCalled();
  });

  test("passes through AI chat functionality", () => {
    const mockHandleInputChange = vi.fn();
    const mockHandleSubmit = vi.fn();

    (useAIChat as any).mockReturnValue({
      ...mockUseAIChat,
      handleInputChange: mockHandleInputChange,
      handleSubmit: mockHandleSubmit,
      status: "loading",
    });

    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );

    expect(screen.getByTestId("status").textContent).toBe("loading");

    // Verify functions are passed through
    const textarea = screen.getByTestId("input");
    const form = screen.getByTestId("form");

    expect(textarea).toBeDefined();
    expect(form).toBeDefined();
  });

  test("handles tool calls", () => {
    let onToolCallHandler: any;

    (useAIChat as any).mockImplementation((config: any) => {
      onToolCallHandler = config.onToolCall;
      return mockUseAIChat;
    });

    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );

    const toolCall = { toolName: "test", args: {} };
    onToolCallHandler({ toolCall });

    expect(mockHandleToolCall).toHaveBeenCalledWith(toolCall);
  });

  test("exposes provider error messages", () => {
    (useAIChat as any).mockReturnValue({
      ...mockUseAIChat,
      status: "error",
      error: new Error("User location is not supported for the API use."),
    });

    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );

    expect(screen.getByTestId("status").textContent).toBe("error");
    expect(screen.getByTestId("error").textContent).toBe(
      "User location is not supported for the API use."
    );
    expect(screen.getByTestId("retryable").textContent).toBe("false");
  });

  test("only allows retry for 429 quota errors", async () => {
    const reload = vi.fn().mockResolvedValue(undefined);

    (useAIChat as any).mockReturnValue({
      ...mockUseAIChat,
      status: "error",
      error: new Error("429 Too Many Requests: quota exceeded."),
      reload,
    });

    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );

    expect(screen.getByTestId("retryable").textContent).toBe("true");

    act(() => {
      screen.getByTestId("retry").click();
    });

    await waitFor(() => {
      expect(reload).toHaveBeenCalledTimes(1);
    });
  });

  test("syncs generated files from assistant code blocks", async () => {
    (useAIChat as any).mockReturnValue({
      ...mockUseAIChat,
      messages: [
        {
          id: "assistant-1",
          role: "assistant",
          content:
            "```jsx\n// /App.jsx\nexport default function App() {\n  return <div>Hello</div>;\n}\n```",
        },
      ],
    });

    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );

    await waitFor(() => {
      expect(mockApplyGeneratedFiles).toHaveBeenCalledWith([
        {
          path: "/App.jsx",
          content:
            "export default function App() {\n  return <div>Hello</div>;\n}\n",
        },
      ]);
    });
  });
});
