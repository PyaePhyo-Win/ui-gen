"use client";

import { Message } from "ai";
import { cn } from "@/lib/utils";
import { User, Bot, Loader2, AlertCircle } from "lucide-react";
import {
  ASSISTANT_FALLBACK_STATUS,
  hasAssistantCodeBlocks,
  summarizeAssistantResponse,
  summarizeToolInvocation,
} from "@/lib/assistant-response";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { Button } from "@/components/ui/button";

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  errorMessage?: string | null;
  canRetry?: boolean;
  onRetry?: () => void | Promise<void>;
  isRetrying?: boolean;
}

export function MessageList({
  messages,
  isLoading,
  errorMessage,
  canRetry,
  onRetry,
  isRetrying,
}: MessageListProps) {
  if (messages.length === 0 && !errorMessage) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center px-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
          <Bot className="h-7 w-7 text-blue-600" />
        </div>

        <p className="mt-5 text-lg font-semibold text-neutral-950">
          Start a conversation to generate React components
        </p>

        <p className="mt-2 max-w-sm text-sm leading-6 text-neutral-500">
          I can help you create buttons, forms, cards, and more
        </p>

        <p className="mt-4 max-w-sm text-xs leading-5 text-neutral-400">
          Try a component request, a redesign prompt, or a debugging question.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col px-4 py-5 md:px-5">
      <div className="mx-auto w-full max-w-4xl space-y-5">
        {messages.map((message) => {
          const hasToolInvocations =
            message.role === "assistant"
              ? message.parts?.some((part) => part.type === "tool-invocation") ?? false
              : false;
          const assistantText =
            message.role === "assistant"
              ? typeof message.content === "string" && message.content.length > 0
                ? message.content
                : message.parts
                    ?.flatMap((part) => (part.type === "text" ? [part.text] : []))
                    .join("") ?? ""
              : "";
          const showFallbackStatus =
            message.role === "assistant" &&
            !hasToolInvocations &&
            hasAssistantCodeBlocks(assistantText);

          return (
          <div
            key={message.id || message.content}
            className={cn(
              "flex items-start gap-3",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {message.role === "assistant" && (
              <div className="flex-shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100">
                  <Bot className="h-4 w-4 text-neutral-600" />
                </div>
              </div>
            )}
            
            <div className={cn(
              "flex min-w-0 flex-col gap-1.5",
              message.role === "user"
                ? "w-fit max-w-[42rem] items-end"
                : "w-full max-w-[42rem] items-start"
            )}>
              <div className="flex items-center gap-2 px-1">
                <span className="text-[11px] font-medium text-neutral-500">
                  {message.role === "user" ? "You" : "Assistant"}
                </span>
              </div>

              <div className={cn(
                "min-w-0 overflow-hidden rounded-xl rounded-2xl px-4 py-3",
                message.role === "user"
                  ? "w-fit max-w-full bg-blue-600 text-white"
                  : "w-full border border-neutral-200 bg-neutral-50 text-neutral-900"
              )}
              data-message-bubble={message.role}
              >
                <div className="text-sm">
                  {message.parts ? (
                    <>
                      {message.parts.map((part, partIndex) => {
                        switch (part.type) {
                          case "text":
                            return message.role === "user" ? (
                              <span key={partIndex} className="whitespace-pre-wrap">{part.text}</span>
                            ) : (
                              <MarkdownRenderer
                                key={partIndex}
                                content={summarizeAssistantResponse(part.text)}
                                className="prose-sm"
                              />
                            );
                          case "reasoning":
                            return (
                              <div key={partIndex} className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3">
                                <span className="mb-1 block text-[11px] font-medium text-amber-700">
                                  Reasoning
                                </span>
                                <span className="text-sm leading-6 text-amber-950">
                                  {part.reasoning}
                                </span>
                              </div>
                            );
                          case "tool-invocation":
                            const tool = part.toolInvocation;
                            return (
                              <div key={partIndex} className="mt-3 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-mono">
                                {tool.state === "result" && tool.result ? (
                                  <>
                                    <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                                    <span className="text-neutral-700">
                                      {summarizeToolInvocation(tool)}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                                    <span className="text-neutral-700">
                                      {summarizeToolInvocation(tool)}
                                    </span>
                                  </>
                                )}
                              </div>
                            );
                          case "source":
                            return (
                              <div key={partIndex} className="mt-3 text-xs text-neutral-500">
                                Source: {JSON.stringify(part.source)}
                              </div>
                            );
                          case "step-start":
                            return partIndex > 0 ? <hr key={partIndex} className="my-4 border-neutral-200" /> : null;
                          default:
                            return null;
                        }
                      })}
                      {isLoading &&
                        message.role === "assistant" &&
                        messages.indexOf(message) === messages.length - 1 && (
                          <div className="mt-4 flex items-center gap-2 text-neutral-500">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span className="text-sm">Generating...</span>
                          </div>
                        )}
                      {showFallbackStatus && (
                        <div className="mt-3 rounded-lg border border-neutral-200 bg-white/70 px-3 py-2 text-xs text-neutral-500">
                          {ASSISTANT_FALLBACK_STATUS}
                        </div>
                      )}
                    </>
                  ) : message.content ? (
                    message.role === "user" ? (
                      <span className="whitespace-pre-wrap">{message.content}</span>
                    ) : (
                      <>
                        <MarkdownRenderer
                          content={summarizeAssistantResponse(message.content)}
                          className="prose-sm"
                        />
                        {showFallbackStatus && (
                          <div className="mt-3 rounded-lg border border-neutral-200 bg-white/70 px-3 py-2 text-xs text-neutral-500">
                            {ASSISTANT_FALLBACK_STATUS}
                          </div>
                        )}
                      </>
                    )
                  ) : isLoading &&
                    message.role === "assistant" &&
                    messages.indexOf(message) === messages.length - 1 ? (
                    <div className="flex items-center gap-2 text-neutral-500">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="text-sm">Generating...</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
            
            {message.role === "user" && (
              <div className="flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,_#2563eb_0%,_#1d4ed8_100%)] shadow-[0_18px_30px_-24px_rgba(37,99,235,0.75)]">
                  <User className="h-4.5 w-4.5 text-white" />
                </div>
              </div>
            )}
          </div>
        )})}

        {errorMessage && (
          <div className="flex w-full gap-4 justify-start">
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50">
                <AlertCircle className="h-4.5 w-4.5 text-red-600" />
              </div>
            </div>

            <div className="flex w-full max-w-[42rem] flex-col gap-2 items-start">
              <div className="w-full overflow-hidden rounded-xl rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-950" data-message-bubble="error">
                <div className="mb-2 flex items-center gap-2 text-red-700">
                  <span className="text-xs font-medium">
                    Error
                  </span>
                </div>
                <div className="text-sm">
                  <MarkdownRenderer content={errorMessage} className="prose-sm" />
                </div>
                {canRetry && onRetry && (
                  <div className="mt-3">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-red-200 text-red-800 hover:bg-red-100 hover:text-red-900"
                      onClick={() => {
                        void onRetry();
                      }}
                      disabled={isRetrying}
                    >
                      {isRetrying ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Retrying...
                        </>
                      ) : (
                        "Retry"
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}