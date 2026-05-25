"use client";

import { useEffect, useRef } from "react";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from "@/lib/contexts/chat-context";

export function ChatInterface() {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    errorMessage,
    canRetryError,
    retryLastMessage,
  } = useChat();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, errorMessage]);

  return (
    <div className="flex h-full flex-col overflow-hidden p-4">
      <div className="mb-3 px-1">
        <p className="text-xs font-medium text-neutral-500">
          Chat history
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        {messages.length === 0 && !errorMessage ? (
          <div className="flex h-full flex-1 flex-col items-center justify-center overflow-hidden px-4 py-6">
            <MessageList
              messages={messages}
              isLoading={status === "streaming"}
              errorMessage={errorMessage}
              canRetry={canRetryError}
              onRetry={retryLastMessage}
              isRetrying={status === "submitted" || status === "streaming"}
            />
          </div>
        ) : (
          <ScrollArea
            ref={scrollAreaRef}
            className="h-full flex-1 overflow-hidden"
          >
            <MessageList
              messages={messages}
              isLoading={status === "streaming"}
              errorMessage={errorMessage}
              canRetry={canRetryError}
              onRetry={retryLastMessage}
              isRetrying={status === "submitted" || status === "streaming"}
            />
          </ScrollArea>
        )}
      </div>

      <div className="mt-4 flex-shrink-0">
        <MessageInput
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          isLoading={status === "submitted" || status === "streaming"}
        />
      </div>
    </div>
  );
}
