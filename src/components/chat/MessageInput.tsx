"use client";

import { ChangeEvent, FormEvent, KeyboardEvent } from "react";
import { Send } from "lucide-react";

interface MessageInputProps {
  input: string;
  handleInputChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
}

export function MessageInput({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
}: MessageInputProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) {
        form.requestSubmit();
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative rounded-2xl border border-neutral-200 bg-white p-3"
    >
      <div className="mx-auto max-w-4xl">
        <div className="mb-2 flex items-center justify-between gap-3 px-1">
          <p className="text-xs text-neutral-500">
            Press Enter to send. Use Shift+Enter for a new line.
          </p>

          <p className="hidden text-xs text-neutral-400 sm:block">
            {isLoading ? "Generating..." : "Ready"}
          </p>
        </div>

        <textarea
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Describe the React component you want to create..."
          disabled={isLoading}
          className="w-full min-h-[92px] max-h-[220px] resize-none rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[15px] font-normal text-neutral-900 transition-colors placeholder:text-neutral-400 focus:border-blue-500/50 focus:outline-none focus:ring-3 focus:ring-blue-500/10"
          rows={3}
        />

        <div className="mt-3 flex items-center justify-between gap-3 px-1">
          <p className="text-xs text-neutral-500">
            {isLoading
              ? "The assistant is responding."
              : "Ask for a component, edit, or bug fix."}
          </p>

          <button
            type="submit"
            disabled={isLoading || !input?.trim()}
            className="group inline-flex flex-shrink-0 items-center gap-2 rounded-lg bg-neutral-900 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400"
          >
            <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            Send
          </button>
        </div>
      </div>
    </form>
  );
}