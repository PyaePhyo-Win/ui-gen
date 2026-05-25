"use client";

import { Message } from "ai";
import { cn } from "@/lib/utils";
import { User, Bot, Loader2, AlertCircle } from "lucide-react";
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
      <div className="flex flex-col items-center justify-center h-full w-full px-4 text-center">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 mb-4 shadow-sm">
          <Bot className="h-7 w-7 text-blue-600" />
        </div>
        <p className="text-neutral-900 font-semibold text-lg mb-2">
          Start a conversation to generate React components
        </p>
        <p className="text-neutral-500 text-sm max-w-sm">
          I can help you create buttons, forms, cards, and more
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col pr-4 py-6">
      <div className="space-y-6 max-w-4xl mx-auto w-full">
        {messages.map((message) => (
          <div
            key={message.id || message.content}
            className={cn(
              "flex gap-4",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {message.role === "assistant" && (
              <div className="flex-shrink-0">
                <div className="w-9 h-9 rounded-lg bg-white border border-neutral-200 shadow-sm flex items-center justify-center">
                  <Bot className="h-4.5 w-4.5 text-neutral-700" />
                </div>
              </div>
            )}
            
            <div className={cn(
              "flex flex-col gap-2 max-w-[85%]",
              message.role === "user" ? "items-end" : "items-start"
            )}>
              <div className={cn(
                "rounded-xl px-4 py-3",
                message.role === "user" 
                  ? "bg-blue-600 text-white shadow-sm" 
                  : "bg-white text-neutral-900 border border-neutral-200 shadow-sm"
              )}>
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
                                content={part.text}
                                className="prose-sm"
                              />
                            );
                          case "reasoning":
                            return (
                              <div key={partIndex} className="mt-3 p-3 bg-white/50 rounded-md border border-neutral-200">
                                <span className="text-xs font-medium text-neutral-600 block mb-1">Reasoning</span>
                                <span className="text-sm text-neutral-700">{part.reasoning}</span>
                              </div>
                            );
                          case "tool-invocation":
                            const tool = part.toolInvocation;
                            return (
                              <div key={partIndex} className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
                                {tool.state === "result" && tool.result ? (
                                  <>
                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                    <span className="text-neutral-700">{tool.toolName}</span>
                                  </>
                                ) : (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                                    <span className="text-neutral-700">{tool.toolName}</span>
                                  </>
                                )}
                              </div>
                            );
                          case "source":
                            return (
                              <div key={partIndex} className="mt-2 text-xs text-neutral-500">
                                Source: {JSON.stringify(part.source)}
                              </div>
                            );
                          case "step-start":
                            return partIndex > 0 ? <hr key={partIndex} className="my-3 border-neutral-200" /> : null;
                          default:
                            return null;
                        }
                      })}
                      {isLoading &&
                        message.role === "assistant" &&
                        messages.indexOf(message) === messages.length - 1 && (
                          <div className="flex items-center gap-2 mt-3 text-neutral-500">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span className="text-sm">Generating...</span>
                          </div>
                        )}
                    </>
                  ) : message.content ? (
                    message.role === "user" ? (
                      <span className="whitespace-pre-wrap">{message.content}</span>
                    ) : (
                      <MarkdownRenderer content={message.content} className="prose-sm" />
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
                <div className="w-9 h-9 rounded-lg bg-blue-600 shadow-sm flex items-center justify-center">
                  <User className="h-4.5 w-4.5 text-white" />
                </div>
              </div>
            )}
          </div>
        ))}

        {errorMessage && (
          <div className="flex gap-4 justify-start">
            <div className="flex-shrink-0">
              <div className="w-9 h-9 rounded-lg bg-red-50 border border-red-200 shadow-sm flex items-center justify-center">
                <AlertCircle className="h-4.5 w-4.5 text-red-600" />
              </div>
            </div>

            <div className="flex flex-col gap-2 max-w-[85%] items-start">
              <div className="rounded-xl px-4 py-3 bg-red-50 text-red-950 border border-red-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wide">
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