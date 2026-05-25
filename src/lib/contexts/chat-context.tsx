"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useRef,
} from "react";
import { useChat as useAIChat } from "@ai-sdk/react";
import { Message } from "ai";
import {
  extractGeneratedFilesFromText,
  getAssistantMessageText,
} from "@/lib/assistant-response";
import { useFileSystem } from "./file-system-context";
import { setHasAnonWork } from "@/lib/anon-work-tracker";

interface ChatContextProps {
  projectId?: string;
  initialMessages?: Message[];
}

interface ChatContextType {
  messages: Message[];
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  status: string;
  errorMessage: string | null;
  canRetryError: boolean;
  retryLastMessage: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

function isRetryableQuotaError(message: string): boolean {
  const normalizedMessage = message.toLowerCase();
  const has429Signal =
    normalizedMessage.includes("429") ||
    normalizedMessage.includes("too many requests");
  const hasQuotaSignal =
    normalizedMessage.includes("quota") ||
    normalizedMessage.includes("rate limit") ||
    normalizedMessage.includes("resource has been exhausted");

  return has429Signal && hasQuotaSignal;
}

export function ChatProvider({
  children,
  projectId,
  initialMessages = [],
}: ChatContextProps & { children: ReactNode }) {
  const { fileSystem, handleToolCall, applyGeneratedFiles } = useFileSystem();
  const syncedMessageVersionsRef = useRef(new Map<string, string>());

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    error,
    reload,
  } = useAIChat({
    api: "/api/chat",
    initialMessages,
    body: {
      files: fileSystem.serialize(),
      projectId,
    },
    onToolCall: ({ toolCall }) => {
      handleToolCall(toolCall);
    },
  });

  const errorMessage =
    error instanceof Error
      ? error.message.trim() || "An unknown error occurred."
      : null;
  const canRetryError = errorMessage ? isRetryableQuotaError(errorMessage) : false;

  const retryLastMessage = async () => {
    if (!canRetryError) {
      return;
    }

    await reload();
  };

  useEffect(() => {
    messages.forEach((message, index) => {
      if (message.role !== "assistant") {
        return;
      }

      const hasToolInvocations =
        message.parts?.some((part) => part.type === "tool-invocation") ?? false;

      if (hasToolInvocations) {
        return;
      }

      const files = extractGeneratedFilesFromText(getAssistantMessageText(message));

      if (files.length === 0) {
        return;
      }

      const messageKey = message.id || `assistant-${index}`;
      const signature = JSON.stringify(files);

      if (syncedMessageVersionsRef.current.get(messageKey) === signature) {
        return;
      }

      applyGeneratedFiles(files);
      syncedMessageVersionsRef.current.set(messageKey, signature);
    });
  }, [messages, applyGeneratedFiles]);

  // Track anonymous work
  useEffect(() => {
    if (!projectId && messages.length > 0) {
      setHasAnonWork(messages, fileSystem.serialize());
    }
  }, [messages, fileSystem, projectId]);

  return (
    <ChatContext.Provider
      value={{
        messages,
        input,
        handleInputChange,
        handleSubmit,
        status,
        errorMessage,
        canRetryError,
        retryLastMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}