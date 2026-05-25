"use client";

import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const blockCodeShellClassName =
  "not-prose my-4 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100";

const blockCodePreClassName = "overflow-x-auto px-4 py-3";

const blockCodeClassName =
  "block min-w-max bg-transparent p-0 font-mono text-[13px] leading-6 text-neutral-900";

export function MarkdownRenderer({
  content,
  className,
}: MarkdownRendererProps) {
  return (
    <div className={cn("chat-markdown prose max-w-none leading-tight", className)}>
      <ReactMarkdown
        components={{
          pre: ({ children }) => <>{children}</>,
          code: ({ children, className, node: _node, ...props }) => {
            const match = /language-([A-Za-z0-9_-]+)/.exec(className || "");
            const language = match?.[1]?.toLowerCase();
            const rawCodeContent = String(children);
            const codeContent = rawCodeContent.replace(/\n$/, "");
            const isBlockCode =
              Boolean(language) ||
              rawCodeContent.endsWith("\n") ||
              codeContent.includes("\n");

            if (!isBlockCode) {
              return (
                <code
                  className="not-prose text-sm px-1 py-0.5 rounded-sm bg-neutral-100 text-neutral-900 font-mono"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            if (language) {
              return (
                <div className={blockCodeShellClassName}>
                  <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-4 py-2">
                    <span className="text-[11px] font-medium text-neutral-500">
                      {language}
                    </span>
                  </div>
                  <pre className={blockCodePreClassName}>
                    <SyntaxHighlighter
                      language={language}
                      style={oneLight}
                      PreTag="div"
                      wrapLongLines={false}
                      customStyle={{
                        margin: 0,
                        padding: 0,
                        background: "transparent",
                      }}
                      codeTagProps={{
                        className: cn(blockCodeClassName, className),
                      }}
                    >
                      {codeContent}
                    </SyntaxHighlighter>
                  </pre>
                </div>
              );
            }

            return (
              <div className={blockCodeShellClassName}>
                <pre className={blockCodePreClassName}>
                  <code
                    className={cn(blockCodeClassName, className)}
                    {...props}
                  >
                    {codeContent}
                  </code>
                </pre>
              </div>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
